//
// Created by 小老虎 on 2020/8/15.
//
#include "ts_parser.h"
#include "about.h"
#include "utils/ts_utils.h"
#include "utils/tools.h"
#include "utils/common_string.h"

/**
 *
 ********************************* Global Define Const Value @Private *************************
 *
 */
#define GENERATE_MODE_PACKETDATA_MEMBER 0
#define GENERATE_MODE_CACHE_LINKLIST 1
#define DEFAULT_SAMPLE_RATE 44100
#define DEFAULT_FPS 24
const char *CONSTS_NOCODEC = "NOCODEC";


/**
 *
 ********************************* Global Define Demux useful Struct @Private **************************
 *
 */
// AVIO read_packet callback data struct
typedef struct BufferData
{
    uint8_t *ptr; /* 文件中对应位置指针 */
    size_t size;  ///< size left in the buffer /* 文件当前指针到末尾 */
} BufferData;


/**
 *
 ********************************* Global Define Demux useful Value , @Private *************************
 *
 */
// bd: for io input
BufferData bd = {0};

// error info
char buffer_error[1024] = {0};

// cache pktData
CachePktNode *cachedPktHeadNode = NULL;


/**
 *
 ********************************* Functions *************************
 *
 */

/**
 *
 ************************************** @private ********************************************
 *
 */

/**
 * dump packetData's data content
 * @param tsBox
 */
void dumpPkgData(PacketData *packetData) {
    printf("============> dump pkg data, type: %d, size: %d, ptime: %f, ftype: %d, dtime: %f\n",
        packetData->type,
        packetData->size,
        packetData->ptime,
        packetData->frameType,
        packetData->dtime
        );
}

void dumpMediaInfo(TSBox *tsBox) {
    printf("============> dump media info, \n"
           "samplerate %d , channel %d, \n"
           "fps %f, %f, gop %d, width %d, height %d, \n"
           "vduration %f, aduration %f, duration %f\n"
           "vcodec %s, acodec %s\n",
           tsBox->mediaInfo.a_sample_rate,
           tsBox->mediaInfo.a_channel,
           tsBox->mediaInfo.fps, tsBox->v_fps,
           tsBox->mediaInfo.gop,

           tsBox->extensionInfo.width,
           tsBox->extensionInfo.height,

           tsBox->mediaInfo.v_duration,
           tsBox->mediaInfo.a_duration,
           tsBox->mediaInfo.duration,

           tsBox->v_codec,
           tsBox->a_codec
    );
}

/**
 * @private
 * @param pktData
 * @return
 */
int releasePacketDataContent(PacketData *pktData) {
    if (pktData != NULL) {
        if (pktData->data != NULL) {
            free(pktData->data);
            pktData->data = NULL;
        }

        pktData->size     = 0;
        pktData->type     = 0;
        pktData->ptime    = 0;
        pktData->dtime    = 0;
        pktData->frameType= 0;
        pktData->size     = 0;
    }

    return 0;
}

/**
 * @Private set packetData struct
 * @param tsBox
 * @return
 */
int setPacketDataInfoByAVPacket(TSBox *tsBox) {
    if (tsBox == NULL) {
        return -1;
    }

    // Free old memory
    if (tsBox->packetData != NULL) {
        releasePacketDataContent(tsBox->packetData);
        /*
        if (tsBox->packetData->data != NULL) {
            free(tsBox->packetData->data);
            tsBox->packetData->data = NULL;
        }

        tsBox->packetData->size     = 0;
        tsBox->packetData->type     = 0;
        tsBox->packetData->ptime    = 0;
        tsBox->packetData->dtime    = 0;
        tsBox->packetData->size     = 0;
         */
    } else {
        tsBox->packetData = (PacketData *)malloc(sizeof(PacketData));
    }

    // Alloc New memory
    if (av_read_frame(tsBox->formatContext, tsBox->avPacket) >= 0) {
        if (tsBox->avPacket->data == NULL) {
            av_packet_unref(tsBox->avPacket);
            return -2;
        }

        tsBox->packetData->data = (uint8_t *)malloc(tsBox->avPacket->size);
        tsBox->packetData->size = tsBox->avPacket->size;
        tsBox->packetData->type = tsBox->avPacket->stream_index == tsBox->v_video_index ? 0 : 1;

        // memory copy
        memcpy(tsBox->packetData->data, tsBox->avPacket->data, tsBox->avPacket->size);

        // get data
        if (tsBox->avPacket->stream_index == tsBox->v_video_index) {
            if (tsBox->v_start_time < 0) {
                tsBox->v_start_time = (tsBox->avPacket->dts < tsBox->avPacket->pts) ?
                                      tsBox->avPacket->dts : tsBox->avPacket->pts;
            }
            tsBox->avPacket->dts -= tsBox->v_start_time;
            tsBox->avPacket->pts -= tsBox->v_start_time;

            tsBox->packetData->ptime = tsBox->avPacket->pts * tsBox->v_timebase;
            tsBox->packetData->dtime = tsBox->avPacket->dts * tsBox->v_timebase;
            tsBox->packetData->frameType = tsBox->avPacket->flags == 0x0001 ? 1 : 0;
        } else if (tsBox->avPacket->stream_index == tsBox->v_audio_index) {
            // fprintf(stdout, "VideoMissile TSDmuxer audio pkt.size=%d,pkt.pts=%lld, pkt.data=0x%x.\n",
            // tsBox->avPacket->size, tsBox->avPacket->pts,(unsigned int)tsBox->avPacket->data);

            if (tsBox->a_start_time < 0) {
                tsBox->a_start_time = (tsBox->avPacket->dts < tsBox->avPacket->pts) ?
                                      tsBox->avPacket->dts : tsBox->avPacket->pts;
            }

            tsBox->avPacket->dts -= tsBox->a_start_time;
            tsBox->avPacket->pts -= tsBox->a_start_time;

            tsBox->packetData->ptime = tsBox->avPacket->pts * tsBox->a_timebase;
            tsBox->packetData->dtime = tsBox->avPacket->dts * tsBox->a_timebase;
            tsBox->packetData->frameType = 1;
        }
        //dumpPkgData(tsBox->packetData);
    } else {
        av_packet_unref(tsBox->avPacket);
        return -3;
    }
    av_packet_unref(tsBox->avPacket);

    return 0;
}

/**
 * @private
 * release it
 * @return
 */
int releaseCachePktLinkList() {
    CachePktNode *ptr = cachedPktHeadNode;
    while (ptr != NULL) {
        if (ptr->pktData != NULL) {
            releasePacketDataContent(ptr->pktData);
            free(ptr->pktData);
            ptr->pktData = NULL;
        }
        ptr = ptr->next;
    }
    ptr = NULL;
    free(cachedPktHeadNode);
    cachedPktHeadNode = NULL;
    return 0;
}

PacketData *setPacketDataInfoByAVPacketUseCache(TSBox *tsBox, CachePktNode *cachePtr) {
    if (tsBox == NULL) {
        return NULL;
    }

    cachePtr->next = (CachePktNode *)malloc(sizeof(CachePktNode));
    cachePtr->next->pktData = NULL; // main
    cachePtr->next->next = NULL;

    // Alloc New memory
    if (av_read_frame(tsBox->formatContext, tsBox->avPacket) >= 0) {
        cachePtr->next->pktData = (PacketData *)malloc(sizeof(PacketData));

        if (tsBox->avPacket->data == NULL) {
            av_packet_unref(tsBox->avPacket);
            return NULL;
        }

        cachePtr->next->pktData->data = (uint8_t *)malloc(tsBox->avPacket->size);
        cachePtr->next->pktData->size = tsBox->avPacket->size;
        cachePtr->next->pktData->type = tsBox->avPacket->stream_index == tsBox->v_video_index ? 0 : 1;

        // memory copy
        // src dst dstlen
        memcpy(cachePtr->next->pktData->data, tsBox->avPacket->data, tsBox->avPacket->size);

        // get data
        if (tsBox->avPacket->stream_index == tsBox->v_video_index) {
            if (tsBox->v_start_time < 0) {
                tsBox->v_start_time = (tsBox->avPacket->dts < tsBox->avPacket->pts) ?
                                      tsBox->avPacket->dts : tsBox->avPacket->pts;
            }

            tsBox->avPacket->dts -= tsBox->v_start_time;
            tsBox->avPacket->pts -= tsBox->v_start_time;

            cachePtr->next->pktData->ptime = tsBox->avPacket->pts * tsBox->v_timebase;
            cachePtr->next->pktData->dtime = tsBox->avPacket->dts * tsBox->v_timebase;

            //#define AV_PKT_FLAG_KEY     0x0001 ///< The packet contains a keyframe
            //#define AV_PKT_FLAG_CORRUPT 0x0002 ///< The packet content is corrupted
            ///**
            // * Flag is used to discard packets which are required to maintain valid
            // * decoder state but are not required for output and should be dropped
            // * after decoding.
            // **/
            //#define AV_PKT_FLAG_DISCARD   0x0004
            ///**
            // * The packet comes from a trusted source.
            // *
            // * Otherwise-unsafe constructs such as arbitrary pointers to data
            // * outside the packet may be followed.
            // */
            //#define AV_PKT_FLAG_TRUSTED   0x0008
            ///**
            // * Flag is used to indicate packets that contain frames that can
            // * be discarded by the decoder.  I.e. Non-reference frames.
            // */
            //#define AV_PKT_FLAG_DISPOSABLE 0x0010
            cachePtr->next->pktData->frameType = tsBox->avPacket->flags == 0x0001 ? 1 : 0;
        } else if (tsBox->avPacket->stream_index == tsBox->v_audio_index) {

            if (tsBox->a_start_time < 0) {
                tsBox->a_start_time = (tsBox->avPacket->dts < tsBox->avPacket->pts) ?
                                      tsBox->avPacket->dts : tsBox->avPacket->pts;
            }

            tsBox->avPacket->dts -= tsBox->a_start_time;
            tsBox->avPacket->pts -= tsBox->a_start_time;

            cachePtr->next->pktData->ptime = tsBox->avPacket->pts * tsBox->a_timebase;
            cachePtr->next->pktData->dtime = tsBox->avPacket->dts * tsBox->a_timebase;
            cachePtr->next->pktData->frameType = 1;
        }

        //dumpPkgData(cachePtr->next->pktData);
    } else {
        av_packet_unref(tsBox->avPacket);
        return NULL;
    }

    av_packet_unref(tsBox->avPacket);
    return cachePtr->next->pktData;
}

int mapSampleRateDuration(double frameDuration) {
    int sampleList[] = {
            96000,
            88200,
            64000,
            48000,
            44100,
            32000,
            24000,
            22050,
            16000,
            12000,
            11025,
            8000,
            7350
    };
    int64_t listLen = sizeof(sampleList) / sizeof(int);

    int sampleRate = 0;

    // 23.20
    double diff = 10000.0;
    for (int i = 0; i < listLen; i++) {
        double temp_diff = frameDuration - 1024.0 * 1000.0 / sampleList[i];
        temp_diff = temp_diff < 0 ? temp_diff * -1.0 : temp_diff;
        //printf("temp_diff : %d %f\n", sampleList[i], temp_diff);

        if (temp_diff < diff) {
            sampleRate = sampleList[i];
            diff = temp_diff;
        }
    }

    return sampleRate;
}

/**
 * @private
 * @brief when ts/flv duration is empty, get info by loop it, and to cache pkt list
 * @param tsBox
 * @return
 */
int loopSetMediaInfoHardAndUseCachePkt(TSBox *tsBox) {
    if (tsBox == NULL) {
        return -1;
    }

    double maxDuration = -1;
    // 目前只有音频获取不到pts dts 先兼容音频
    int aFrameCount = 0;

    // loop

    // init head node
    if (cachedPktHeadNode != NULL) {
        releaseCachePktLinkList();
    }
    cachedPktHeadNode = (CachePktNode *)malloc(sizeof(CachePktNode));
    cachedPktHeadNode->next = NULL;
    cachedPktHeadNode->pktData = NULL;

    // set cache ptr member of tsBox
    tsBox->cachePtr = cachedPktHeadNode;

    // tempPtr
    CachePktNode *tempCachePtr = cachedPktHeadNode;

    PacketData *dataPtr = NULL;
    while (1) {
        dataPtr = setPacketDataInfoByAVPacketUseCache(tsBox, tempCachePtr);
        if (dataPtr == NULL) {
            break;
        }
        if (dataPtr->type == 0) { // video
            if (dataPtr->ptime > maxDuration) {
                maxDuration = dataPtr->ptime;
            }
        } else {
            // get freqIdx
/*
   ff       f1         50     40       01       7f       fc       --> 01182007
11111111 11110001 01010000 0100 0000 00000001 01111111 11111100
|---12bits--|
                               |
|------------- 28bits----------|-----------------28 bits-------|
                                 |00 00000001 011| = pkt length = 1011 = 11 (bytes)
                                 --------------------------------------------------
                                 |     ff f1 50 40 01 7f fc 01 18 20 07 <- 11 bytes

   ff       f1              50                 40       01       7f       fc       --> 01182007
11111111|1111 0  00  1  | 01     0100 00 | 0100 0000|00000001|01111111|11111100
|---12bits--| 1b 2b  1b   2b      4b
      v       v           v        v
   syncword  ID          profile  freq
 */
            if (aFrameCount == 0) {
                uint8_t freqTrace = (dataPtr->data[2] >> 2) & 0x0f;
                uint32_t sampleRate = tsmuxerUtilSampleOffsetTable(freqTrace);
                // printf("freqTrace: %d, sample: %d\n", freqTrace, sampleRate);
                if (sampleRate > 0) {
                    tsBox->mediaInfo.a_sample_rate = sampleRate;
                }
            }
            aFrameCount += 1;
        }

        tempCachePtr = tempCachePtr->next;
    }
    tempCachePtr = NULL; // safe mode
    dataPtr = NULL; // safe mode

    //printf("maxDuration : %f\n", maxDuration);
    tsBox->mediaInfo.v_duration = maxDuration;
    tsBox->mediaInfo.a_duration = maxDuration;
    tsBox->mediaInfo.duration = maxDuration;

    //printf("aFrameCount:%d\n", aFrameCount);

    /*
    if (tsBox->a_sample_rate <= 0) {
        double aFramePerDuration = 1000.0 * maxDuration / aFrameCount;
        //printf("aFramePerDuration : %f\n", aFramePerDuration);
        tsBox->a_sample_rate = mapSampleRateDuration(aFramePerDuration);
        tsBox->mediaInfo.a_sample_rate = tsBox->a_sample_rate;
    }
    */

    return 0;
}

/**
 * @private
 * @param opaque
 * @param buf
 * @param buf_size
 * @return
 */
//用来将内存buffer的数据拷贝到buf
int read_packet(void *opaque, uint8_t *buf, int buf_size)
{
    //printf("start read_format_packet : %d %d\n", bd.size, buf_size);
    buf_size = FFMIN(buf_size, bd.size);

    if (!buf_size)
        return -1;
    //printf("VideoMissile TSDmuxer ptr:%p size:%zu bz%zu\n", bd.ptr, bd.size, buf_size);

    /* copy internal buffer data to buf */
    memcpy(buf, bd.ptr, buf_size);
    bd.ptr += buf_size;
    bd.size -= buf_size;

    return buf_size;
}

/**
 *
 ************************************** @public ********************************************
 *
 */

/**
 * @public
 * @param tsBox
 * @return
 */
int initializeDemuxerFunc(TSBox *tsBox) { // , int type
    if (tsBox == NULL) {
        return -1;
    }

    //tsBox->introduceMineFunc();
    av_register_all();
    avcodec_register_all();

    tsBox->avcCoder         = initAVCCoder();
    tsBox->hevCoder         = initHEVCoder();

    tsBox->generateMode     = GENERATE_MODE_PACKETDATA_MEMBER;
    tsBox->cachePtr         = NULL;

    tsBox->formatContext    = NULL;
    tsBox->avPacket         = NULL;
    tsBox->packetData       = NULL;

    // Outside PacketData
    tsBox->packetData           = (PacketData *)malloc(sizeof(PacketData));
    tsBox->packetData->data     = NULL;
    tsBox->packetData->size     = 0;
    tsBox->packetData->type     = 0;

    // Outside MediaInfo
    tsBox->mediaInfo.fps        = -1;
    tsBox->mediaInfo.gop        = 0;
    tsBox->extensionInfo.width  = 0;
    tsBox->extensionInfo.height = 0;
    tsBox->mediaInfo.a_duration = -1;
    tsBox->mediaInfo.v_duration = -1;
    tsBox->mediaInfo.duration   = -1;
    tsBox->mediaInfo.a_sample_rate = 0;
    tsBox->mediaInfo.a_channel     = 0;

    tsBox->v_start_time     = -1;
    tsBox->a_start_time     = -1;
    // tsBox->v_width          = 0;
    // tsBox->v_height         = 0;
    tsBox->v_video_index    = -1;
    tsBox->v_audio_index    = -1;

    tsBox->v_codec          = NULL;
    tsBox->a_codec          = NULL;

    tsBox->v_fps            = -1;
    tsBox->v_gop            = -1;

    //tsBox->a_sample_rate    = 0;
    //tsBox->a_channel        = 0;

    //printf("VideoMissile demuxer init done\n");

    tsBox->formatContext = avformat_alloc_context();

    cachedPktHeadNode = NULL;

    //char *codec = "h265";
    //if (type == 0) {
    //    codec = "h265";
    //} else if (type == 1) {
    //    codec = "h264";
    //} else {
    //    printf("VideoMissile TSDmuxer Codec ID Error! Example 0:hevc 1:avc\n");
    //    return -1;
    //}
    //tsBox->inputFormat = av_find_input_format(codec);

    return 0;
}


// @TODO
/**
 * Demuxer binary data
 * @param tsBox
 * @param buff
 * @param in_len
 * @return
 */
int demuxBoxFunc(TSBox *tsBox, uint8_t *buffer, int read_size, int isLive) {
    //printf("VideoMissile TSDmuxer demuxBoxFunc start!\n");
    if (tsBox == NULL) {
        printf("VideoMissile TSDmuxer is NULL!\n");
        return -1;
    }

    bd.ptr = buffer;
    bd.size = read_size;

    unsigned char *avio_ctx_buffer = (unsigned char *)av_malloc(read_size);

    AVIOContext *avio_ctx = avio_alloc_context(avio_ctx_buffer, read_size, 0, &bd, read_packet, NULL, NULL);
    if (!avio_ctx) {
        printf("VideoMissile TSDmuxer avio alloc failed!\n");
        return -2;
    }

    tsBox->formatContext->pb = avio_ctx; // step3:这一步很关键
    tsBox->formatContext->flags = AVFMT_FLAG_CUSTOM_IO;

    //step4:打开流
    //int openCode = avformat_open_input(&tsBox->formatContext, "", tsBox->inputFormat, NULL);
    AVDictionary* options = NULL;
    av_dict_set(&options, "buffer_size", "409600", 0); //设置缓存大小，1080p可将值调大
    int openCode = avformat_open_input(&tsBox->formatContext, "", NULL, &options);
    if (openCode < 0) {
        av_strerror(openCode, buffer_error, 1024);
        printf("VideoMissile TSDmuxer avformat open failed:%d, read_size:%d err:%s\n",
                openCode, read_size, buffer_error);
        return -3;
    } else {
        //printf("VideoMissile TSDmuxer open stream success!\n");
    }

    //以下就和文件处理一致了
    if (avformat_find_stream_info(tsBox->formatContext, NULL) < 0) {
        printf("VideoMissile TSDmuxercould not fine stream.\n");
        return -4;
    }

    //av_dump_format(tsBox->formatContext, 0, "", 0);

    // unset tsBox codec infomation
    if (tsBox->v_codec != NULL) {
        free(tsBox->v_codec);
        tsBox->v_codec = NULL;
    }
    if (tsBox->a_codec != NULL) {
        free(tsBox->a_codec);
        tsBox->a_codec = NULL;
    }
    // get information
    for (int i = 0; i < tsBox->formatContext->nb_streams; i++) {
        //const char *codec_name = avcodec_get_name(tsBox->formatContext->streams[i]->codecpar->codec_id);
        const char *codec_name = avcodec_get_name(tsBox->formatContext->streams[i]->codec->codec_id);

        if ((tsBox->formatContext->streams[i]->codec->codec_type == AVMEDIA_TYPE_VIDEO)
            && (tsBox->v_video_index < 0)) {
            tsBox->v_video_index = i;
            //printf("vextradata : ");
            //for (int j = 0; j < tsBox->formatContext->streams[0]->codec->extradata_size; j++) {
                //printf("%x ", tsBox->formatContext->streams[0]->codec->extradata[j]);
            //}
            //printf("\n");
            // codec
            tsBox->v_codec = (char *) malloc(sizeof(codec_name));
            strcpy(tsBox->v_codec, codec_name);

            tsBox->extensionInfo.width  = tsBox->formatContext->streams[i]->codec->width;
            tsBox->extensionInfo.height = tsBox->formatContext->streams[i]->codec->height;
            tsBox->v_fps = av_q2d(tsBox->formatContext->streams[i]->r_frame_rate);
            //printf("tsBox->v_fps========================> %f \n", tsBox->v_fps);
            if (tsBox->v_fps < 0) {
                printf("VideoMissile TSDmuxer cannot find fps ,set to default fps %d\n",
                        DEFAULT_FPS);
                tsBox->v_fps = DEFAULT_FPS;
            }

            tsBox->v_gop = tsBox->formatContext->streams[i]->codec->gop_size;
            tsBox->v_timebase = av_q2d(tsBox->formatContext->streams[i]->time_base);

            // mediaInfo
            tsBox->mediaInfo.fps    = tsBox->v_fps;
            tsBox->mediaInfo.gop    = tsBox->v_gop;
            tsBox->mediaInfo.v_duration = tsBox->formatContext->streams[i]->duration * tsBox->v_timebase;
            if (tsBox->mediaInfo.v_duration < 0) {
                tsBox->mediaInfo.v_duration = 0;
            }
        }
        if ((tsBox->formatContext->streams[i]->codec->codec_type == AVMEDIA_TYPE_AUDIO)
            && (tsBox->v_audio_index < 0)) {
            tsBox->v_audio_index = i;

            // codec
            tsBox->a_codec = (char *) malloc(sizeof(codec_name));
            strcpy(tsBox->a_codec, codec_name);
            tsBox->mediaInfo.a_sample_rate = tsBox->formatContext->streams[i]->codec->sample_rate;
            //if (tsBox->a_sample_rate <= 0) {
            //    printf("VideoMissile TSDmuxer cannot find sample rate ,set to default sample rate %d\n",
            //            DEFAULT_SAMPLE_RATE);
            //    tsBox->a_sample_rate = DEFAULT_SAMPLE_RATE;
            //}
            //printf("get sample rate : %d\n", tsBox->a_sample_rate);
            tsBox->mediaInfo.a_channel = tsBox->formatContext->streams[i]->codec->channels;
            tsBox->a_timebase = av_q2d(tsBox->formatContext->streams[i]->time_base);

            // mediaInfo
            //tsBox->mediaInfo.a_sample_rate  = tsBox->a_sample_rate;
            //tsBox->mediaInfo.a_channel      = tsBox->a_channel;
            tsBox->mediaInfo.a_duration     = tsBox->formatContext->streams[i]->duration * tsBox->a_timebase;
            if (tsBox->mediaInfo.a_duration < 0) {
                tsBox->mediaInfo.a_duration = 0;
            }
        }
    }

    // codec check
    if (tsBox->v_codec == NULL) {
        tsBox->v_codec = (char *) malloc(sizeof(CONSTS_NOCODEC));
        strcpy(tsBox->v_codec, CONSTS_NOCODEC);
    }
    if (tsBox->a_codec == NULL) {
        tsBox->a_codec = (char *) malloc(sizeof(CONSTS_NOCODEC));
        strcpy(tsBox->a_codec, CONSTS_NOCODEC);
    }

    //tsBox->mediaInfo.duration = tsBox->mediaInfo.v_duration > tsBox->mediaInfo.a_duration ?
    //        tsBox->mediaInfo.v_duration : tsBox->mediaInfo.a_duration;
    tsBox->mediaInfo.duration = tsBox->formatContext->duration / 1000.0 / 1000.0;

    if (tsBox->v_video_index < 0 && tsBox->v_audio_index < 0) {
        printf("VideoMissile TSDmuxer videoindex=%d, audioindex=%d\n", tsBox->v_video_index, tsBox->v_audio_index);
        return -5;
    }

    // AVPacket
    tsBox->avPacket = (AVPacket *)av_malloc(sizeof(AVPacket));
    av_init_packet(tsBox->avPacket);

    //printf("duration is %f\n", tsBox->mediaInfo.v_duration);

    // is hard reset?
    if (tsBox->mediaInfo.v_duration <= 0 && isLive <= 0) {
        /*
         * 这里不准 弃用暂时
         */
        tsBox->generateMode = GENERATE_MODE_CACHE_LINKLIST;
        //printf("88888888888888888888888888888888888888888888888888888888-1\n");
        loopSetMediaInfoHardAndUseCachePkt(tsBox);
    }

    //dumpMediaInfo(tsBox);

    // Free
    //if (buffer != NULL) {
    //    free(buffer);
    //    buffer = NULL;
    //}

    bd.ptr = NULL;
    bd.size = 0;
    return 0;
}

/**
 * @public
 * @brief get packet data
 * @param tsBox
 * @return
 */
int getPacketFunc(TSBox *tsBox) {
    if (tsBox == NULL) {
        return -1;
    }

    int ret = -2;

    if (tsBox->generateMode == GENERATE_MODE_PACKETDATA_MEMBER) {
        //printf("==========> GET PACKET\n");
        ret = setPacketDataInfoByAVPacket(tsBox);
    } else if (tsBox->generateMode == GENERATE_MODE_CACHE_LINKLIST) {
        if (tsBox->cachePtr->next != NULL && tsBox->cachePtr->next->pktData != NULL) {
            tsBox->packetData = tsBox->cachePtr->next->pktData;
            // set next ptr
            tsBox->cachePtr = tsBox->cachePtr->next;
            ret = 0;
        } else {
            tsBox->packetData = NULL;
            return -3;
        }
    }

    // @TODO TEST
    /*
     * Get Nalu + VLC Data
     */
    if (tsBox->packetData->type == 0 &&
        (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 || STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0)
            ) {
        tsBox->hevCoder->handleFrame(tsBox->hevCoder, tsBox->packetData->data, tsBox->packetData->size);
        //printf("====> 265 key frame : %d\n", tsBox->hevCoder->keyFrame);
        tsBox->packetData->frameType = tsBox->hevCoder->keyFrame;
    }

    if (tsBox->packetData->type == 0 &&
        (STRCMP(tsBox->v_codec, DEF_AVC_STRING) == 0 || STRCMP(tsBox->v_codec, DEF_H264_STRING) == 0)
            ) {
        tsBox->avcCoder->handleFrame(tsBox->avcCoder, tsBox->packetData->data, tsBox->packetData->size);
        //printf("====> 264 key frame : %d\n", tsBox->avcCoder->keyFrame);
        tsBox->packetData->frameType = tsBox->avcCoder->keyFrame;
    }

    return ret;
}

// @TODO
int releaseDemuxerFunc(TSBox *tsBox) {
    if (tsBox->avcCoder != NULL) {
        exitAVCCOder(tsBox->avcCoder);
        free(tsBox->avcCoder);
        tsBox->avcCoder = NULL;
    }

    if (tsBox->hevCoder != NULL) {
        exitHEVCOder(tsBox->hevCoder);
        free(tsBox->hevCoder);
        tsBox->hevCoder = NULL;
    }

    // Free old memory
    if (tsBox->packetData != NULL) {
        releasePacketDataContent(tsBox->packetData);
        /*
        if (tsBox->packetData->data != NULL) {
            free(tsBox->packetData->data);
            tsBox->packetData->data = NULL;
        }

        tsBox->packetData->size     = 0;
        tsBox->packetData->type     = 0;
        tsBox->packetData->ptime    = 0;
        tsBox->packetData->dtime    = 0;
         */

        free(tsBox->packetData);
        tsBox->packetData = NULL;
    }

    if (tsBox->formatContext->pb != NULL) {
        /* note: the internal buffer could have changed, and be != avio_ctx_buffer */
        if (tsBox->formatContext->pb)
            av_freep(&tsBox->formatContext->pb->buffer);
        avio_context_free(&tsBox->formatContext->pb);
        tsBox->formatContext->pb = NULL;
    }

    tsBox->generateMode         = GENERATE_MODE_PACKETDATA_MEMBER;
    tsBox->cachePtr             = NULL;

    // Outside MediaInfo
    tsBox->mediaInfo.fps        = -1;
    tsBox->mediaInfo.gop        = 0;
    tsBox->extensionInfo.width  = 0;
    tsBox->extensionInfo.height = 0;
    tsBox->mediaInfo.a_duration = -1;
    tsBox->mediaInfo.v_duration = -1;
    tsBox->mediaInfo.duration   = -1;
    tsBox->mediaInfo.a_sample_rate = 0;
    tsBox->mediaInfo.a_channel     = 0;


    tsBox->v_start_time     = -1;
    tsBox->a_start_time     = -1;
    // tsBox->v_width          = 0;
    // tsBox->v_height         = 0;
    tsBox->v_video_index    = -1;
    tsBox->v_audio_index    = -1;

    if (tsBox->v_codec != NULL) {
        free(tsBox->v_codec);
        tsBox->v_codec = NULL;
    }
    if (tsBox->a_codec != NULL) {
        free(tsBox->a_codec);
        tsBox->a_codec = NULL;
    }

    tsBox->v_fps            = -1;
    tsBox->v_gop            = -1;

    //tsBox->a_sample_rate    = 0;
    //tsBox->a_channel        = 0;

    av_packet_unref(tsBox->avPacket);
    avformat_close_input(&tsBox->formatContext);
    avformat_free_context(tsBox->formatContext);
    tsBox->formatContext    = NULL;
    // input format ?

    tsBox->avPacket->data = NULL;
    tsBox->avPacket->size = 0;
    tsBox->avPacket = NULL;

    if (cachedPktHeadNode != NULL) {
        releaseCachePktLinkList();
    }

    return 0;
}

/*
 * functions
 */

TSBox* initTSDemuxer() {
    //av_log_set_level(AV_LOG_ERROR);
    TSBox *tsBox = (TSBox *)malloc(sizeof(TSBox));

    tsBox->initializeDemuxerFunc    = initializeDemuxerFunc;
    tsBox->introduceMineFunc        = introduce_mine;
    tsBox->demuxBoxFunc             = demuxBoxFunc;
    tsBox->getPacketFunc            = getPacketFunc;
    tsBox->releaseDemuxerFunc       = releaseDemuxerFunc;

    return tsBox;
}

int exitTSDemuxer(TSBox *tsBox) {
    if (tsBox == NULL) {
        return -1;
    }

    tsBox->releaseDemuxerFunc(tsBox);

    tsBox->initializeDemuxerFunc    = NULL;
    tsBox->introduceMineFunc        = NULL;
    tsBox->demuxBoxFunc             = NULL;
    tsBox->getPacketFunc            = NULL;
    tsBox->releaseDemuxerFunc       = NULL;

    return 0;
}
