//
// Created by 小老虎 on 2022/6/5.
//

#include <emscripten.h>
#include <unistd.h>
// #include <pthread.h>
#include <unistd.h>
// #include <time.h>

#include "about.h"
#include "utils/tools.h"
#include "utils/av_err_code.h"
#include "utils/common_string.h"
#include "decoder/const_codec.h"

#include "sniff_g711core.h"

/**
 *
 ********************************* Global Define Const Value @Private *************************
 *
 */
/************************ Sniff Module ***************************/
#define G711_BUF_SIZE            4096

#define G711_DECODE_EOF_CODE     -404

const enum AVSampleFormat   G711_OUT_SAMPLE_FMT  = AV_SAMPLE_FMT_FLTP;   // 输出的采样格式 16bit PCM
const int                   G711_OUT_SAMPLE_RATE = 44100;                // 输出的采样率
/*
 * AV_CH_LAYOUT_MONO    单声道 NB = 1
 * AV_CH_LAYOUT_STEREO  双声道 NB = 2
 */
const uint64_t              G711_OUT_CN_LAYOUT   = AV_CH_LAYOUT_MONO;    // 输出的声道布局
const int                   G711_OUT_CHANNEL_NB  = 1;

const unsigned char         G711_STARTCODE[4] = {0x00, 0x00, 0x00, 0x01};
// const unsigned char         G711_TEST_STARTCODE[4] = {0xEE, 0xEE, 0xEE, 1};


/*
 * Buffer
 */
//buffer_data m_bd = {0};
//uint8_t *m_bd_temp_ptr = NULL;

/**
 *
 ********************************* Global Define Demux useful Struct @Private **************************
 *
 */

/**
 *
 ********************************* Global Define Demux useful Value , @Private *************************
 *
 */
// Now is single thread, do not need lock/lock-free

/**
 *
 ************************************** @private functions
 ************************************** @member
 *
 */


/**
 * 实质进行的是读取已有内存的size数据，拷贝到buf中。opaque方便参数传递。注意，在拷贝时要对pos累加。
 * @param opaque
 * @param buf
 * @param buf_size
 * @return
 */
int g711_read_stream_live(void *opaque, uint8_t *buf, int buf_size)
{
    //struct buffer_data *bd = (struct buffer_data *)opaque;
    //buf_size = FFMIN(buf_size, bd->size);
    SniffG711CoreContext *sniffG711CoreContext = (SniffG711CoreContext *)opaque;

    //printf("before read_stream FFMIN - bd ptr:%p size:%zu, buf_size:%d\n",
    //       sniffG711CoreContext->m_bd.ptr, sniffG711CoreContext->m_bd.size, buf_size);

    buf_size = FFMIN(buf_size, sniffG711CoreContext->m_bd.size);

    //printf("after read_stream FFMIN - bd ptr:%p size:%zu, buf_size:%d MIN:%lu\n",
    //       sniffG711CoreContext->m_bd.ptr,
    //       sniffG711CoreContext->m_bd.size,
    //       buf_size,
    //       FFMIN(buf_size, sniffG711CoreContext->m_bd.size));

    if (!buf_size) {
        //printf("read_stream - bd ptr:%p bd size:%zu, buf_size:%d ERROR EOF\n",
        //sniffG711CoreContext->m_bd.ptr, sniffG711CoreContext->m_bd.size, buf_size);
        return AVERROR_EOF;
    }
    //printf("read_stream - ptr:%p consume:%d size:%zu pos:%d total:%d\n",
    //        m_bd.ptr, buf_size, m_bd.size, m_bd.read_pos, m_bd.total);

    /* copy internal buffer data to buf */
    //memcpy(buf, m_bd.ptr, buf_size);
    //printf("read_stream - start memcpy\n");
    sniffG711CoreContext->m_bd_temp_ptr = sniffG711CoreContext->m_bd.ptr + sniffG711CoreContext->m_bd.read_pos;

    memcpy(buf, sniffG711CoreContext->m_bd_temp_ptr, buf_size);
    sniffG711CoreContext->m_bd.read_pos += buf_size;

    // patch
    int dstLen = sniffG711CoreContext->m_bd.total - buf_size;
    uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
    int lastBytesLen = removeMallocU8(
            sniffG711CoreContext->m_bd.ptr,
            sniffG711CoreContext->m_bd.total,
            dst, buf_size, dstLen);

    free(sniffG711CoreContext->m_bd.ptr);
    sniffG711CoreContext->m_bd.ptr = dst;
    sniffG711CoreContext->m_bd.total = dstLen;
    sniffG711CoreContext->m_bd.read_pos = 0;
    sniffG711CoreContext->m_bd_temp_ptr = NULL;

    //m_bd.ptr = m_bd.ptr + buf_size;
    //m_bd_temp_ptr = m_bd.ptr + sniffHttpFlvContextTempPtr->m_bd.read_pos;

    //sniffG711CoreContext->m_bd.size -= buf_size;
    sniffG711CoreContext->m_bd.size = dstLen;

    //printf("read_stream - bd ptr:%p bd total_size:%d size:%zu, buf_size:%d, ret:%d\n",
    //        sniffG711CoreContext->m_bd.ptr,
    //        sniffG711CoreContext->m_bd.total,
    //        sniffG711CoreContext->m_bd.size,
    //        buf_size,
    //        rmRet);
    return buf_size;
}

/**
 * @TODO Seek Operation
 * @param opaque
 * @param offset
 * @param whence
 * @return
 */
int g711_seek_in_buffer(void *opaque, int64_t offset, int whence) {
    return -1;
}

int _decodeVideoPkt(SniffG711CoreContext *sniffG711CoreContext) {
    long decodeStartMS = getMillisecondTime();

    char szError[256] = {0};
    int sendRet = avcodec_send_packet(sniffG711CoreContext->m_vCodecContext, sniffG711CoreContext->m_avPacket);
    // int sendRet = avcodec_send_packet(
    //         sniffG711CoreContext->m_formatCtx->streams[sniffG711CoreContext->m_videoIndex]->codec,
    //         sniffG711CoreContext->m_avPacket);

    if (sendRet < 0) {
        if (sendRet == AVERROR(EAGAIN)) {
            printf("decode video: send video===========> need again\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR_EOF) {
            printf("decode video: send video===========> eof\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR(EINVAL)) {
            printf("decode video: send video===========> inval\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR(ENOMEM)) {
            printf("decode video: send video===========> oom\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else {
            //printf("sendRet ===========> %d\n", sendRet);
            av_strerror(sendRet, szError, 256);
            printf("decode video: send video message ===========> %s\n", szError);
            // return sendRet;
        }
        return MISSILE_PKT_GET_NOTHING;
    } // sendRet

    int hasYuv = 0;
    if (sendRet == 0) {
        int rec_re = 0;
        while(1) {
            rec_re = avcodec_receive_frame(sniffG711CoreContext->m_vCodecContext, sniffG711CoreContext->m_frame);
            if (rec_re == AVERROR(EAGAIN) || rec_re == AVERROR_EOF) {
                // av_strerror(rec_re, szError, 256);
                // printf("decode video: rec_re ===========> error %d %s\n", rec_re, szError);
                break;
            } else if (rec_re < 0) {
                // av_strerror(rec_re, szError, 256);
                // printf("decode video: rec_re ===========> error %d %s\n", rec_re, szError);
                break;
            }

            if (rec_re >= 0) {
                //printf("debug +++++ frame pts:%lld\n", sniffG711CoreContext->m_frame->pts);
                if (sniffG711CoreContext->isSetCallback > 0)
                {
                    long decodeEndMS = getMillisecondTime();
                    int decodeCostMS = (int) (decodeEndMS - decodeStartMS);

                    // time_t t1 = time(NULL);

                    // printf("debug callbackYUV==============> time:%ld - %ld = %ld\n",
                    //        decodeEndMS, decodeStartMS, decodeCostMS);

#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)
                    EM_ASM_(
                            {
                                    postMessage(
                                            {
                                                    cmd:"go",
                                                    data: {
                                                            type: "decode_video_g711",
                                                            corePtr: $0,
                                                            y: $1,
                                                            u: $2,
                                                            v: $3,
                                                            line1: $4,
                                                            line2: $5,
                                                            line3: $6,
                                                            w: $7,
                                                            h: $8,
                                                            v_pts: $9,
                                                            tag: $10
                                                    }
                                            }
                                    );
                            },
                            sniffG711CoreContext,
                            sniffG711CoreContext->m_frame->data[0],
                            sniffG711CoreContext->m_frame->data[1],
                            sniffG711CoreContext->m_frame->data[2],
                            sniffG711CoreContext->m_frame->linesize[0],
                            sniffG711CoreContext->m_frame->linesize[1],
                            sniffG711CoreContext->m_frame->linesize[2],
                            sniffG711CoreContext->m_frame->width,
                            sniffG711CoreContext->m_frame->height,
                            (double) sniffG711CoreContext->m_frame->pts * sniffG711CoreContext->m_vTimebase,
                            decodeCostMS
                    );
#else
                    sniffG711CoreContext->yuvFrameCallback(sniffG711CoreContext->m_frame->data[0],
                                                           sniffG711CoreContext->m_frame->data[1],
                                                           sniffG711CoreContext->m_frame->data[2],
                                                           sniffG711CoreContext->m_frame->linesize[0],
                                                           sniffG711CoreContext->m_frame->linesize[1],
                                                           sniffG711CoreContext->m_frame->linesize[2],
                                                           sniffG711CoreContext->m_frame->width,
                                                           sniffG711CoreContext->m_frame->height,
                                                           (double) sniffG711CoreContext->m_frame->pts * sniffG711CoreContext->m_vTimebase,
                                                           decodeCostMS);
#endif

                    hasYuv += 1;
                } // ok
            } else {
                av_strerror(rec_re, szError, 256);
                // Resource temporarily unavailable
                printf("decode video: rec_re ===========> error %d %s\n", rec_re, szError);
                break;
            }
        } // end while receive

        if (hasYuv > 0) {
            // av_frame_unref(sniffG711CoreContext->m_frame);
            return MISSILE_PKT_GET_TYPE_YUV;
        }
    } else {
        return MISSILE_PKT_GET_NOTHING;
    }

    return MISSILE_PKT_GET_NOTHING;
} // end _decodeVideoPkt


int _decodeAudioPkt(SniffG711CoreContext *sniffG711CoreContext) {
    long decodeStartMS = getMillisecondTime();
    char szError[256] = {0};

    int sendRet = avcodec_send_packet(sniffG711CoreContext->m_aCodecContext, sniffG711CoreContext->m_avPacket);

    if (sendRet != 0) {
        if (sendRet == AVERROR(EAGAIN)) {
            printf("send audio===========> need again\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR_EOF) {
            printf("send audio===========> eof\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR(EINVAL)) {
            printf("send audio===========> inval\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR(ENOMEM)) {
            printf("send audio===========> oom\n");
            // return MISSILE_PKT_GET_NOTHING;
        } else {
            //printf("sendRet ===========> %d\n", sendRet);
            av_strerror(sendRet, szError, 256);
            printf("send audio message ===========> %s\n", szError);
            // return sendRet;
        }
        return MISSILE_PKT_GET_NOTHING;
    } // sendRet

    int hasYuv = 0;
    if (sendRet == 0) {
        int rec_re = 0;
        while(1) {
            rec_re = avcodec_receive_frame(sniffG711CoreContext->m_aCodecContext, sniffG711CoreContext->m_aFrame);
            if (rec_re == AVERROR(EAGAIN) || rec_re == AVERROR_EOF) {
                // av_strerror(rec_re, szError, 256);
                // printf("decode video: rec_re ===========> error %d %s\n", rec_re, szError);
                break;
            } else if (rec_re < 0) {
                // av_strerror(rec_re, szError, 256);
                // printf("decode video: rec_re ===========> error %d %s\n", rec_re, szError);
                break;
            }
            if (rec_re == 0) {

                if (sniffG711CoreContext->m_swr_ctx == NULL) {
                    sniffG711CoreContext->m_swr_ctx = swr_alloc();
                    if (!sniffG711CoreContext->m_swr_ctx) {
                        printf("Could not allocate resampler context\n");
                        return MISSILE_PKT_GET_NOTHING;
                    }

                    /* set options */
                    av_opt_set_int(sniffG711CoreContext->m_swr_ctx,
                            "in_channel_layout", sniffG711CoreContext->m_aFrame->channel_layout, 0);
                    av_opt_set_int(sniffG711CoreContext->m_swr_ctx,
                            "in_sample_rate", sniffG711CoreContext->m_aFrame->sample_rate, 0);
                    av_opt_set_sample_fmt(sniffG711CoreContext->m_swr_ctx,
                            "in_sample_fmt", sniffG711CoreContext->m_aFrame->format, 0);

                    av_opt_set_int(sniffG711CoreContext->m_swr_ctx, "out_channel_layout", G711_OUT_CN_LAYOUT, 0);
                    av_opt_set_int(sniffG711CoreContext->m_swr_ctx, "out_sample_rate", G711_OUT_SAMPLE_RATE, 0);
                    av_opt_set_sample_fmt(sniffG711CoreContext->m_swr_ctx, "out_sample_fmt", G711_OUT_SAMPLE_FMT, 0);

                    /* initialize the resampling context */
                    if (swr_init(sniffG711CoreContext->m_swr_ctx) < 0) {
                        fprintf(stderr, "Failed to initialize the resampling context\n");
                        return -1;
                    }

                    sniffG711CoreContext->m_dstFramePerSampleSize = av_get_bytes_per_sample(G711_OUT_SAMPLE_FMT);
                }

                //printf("debug +++++ frame pts:%lld\n", sniffG711CoreContext->m_frame->pts);
                if (sniffG711CoreContext->isSetCallback > 0)
                {
                    // resample
                    AVFrame *resampled = av_frame_alloc();
                    resampled->channel_layout = G711_OUT_CN_LAYOUT; // av_get_default_channel_layout(OUTPUT_CHANNELS);
                    resampled->sample_rate = G711_OUT_SAMPLE_RATE;
                    resampled->format = G711_OUT_SAMPLE_FMT;
                    swr_convert_frame(sniffG711CoreContext->m_swr_ctx, resampled, sniffG711CoreContext->m_aFrame);

                    // dst
                    int dst_per_line_size = resampled->nb_samples * sniffG711CoreContext->m_dstFramePerSampleSize;
                    int dst_total_size = dst_per_line_size * resampled->channels;
                    uint8_t *dst_samples = (uint8_t *) malloc(sizeof(uint8_t) * dst_total_size);

                    for (int i = 0; i < resampled->nb_samples; i++) {
                        int per_size_1line_pos = sniffG711CoreContext->m_dstFramePerSampleSize * i;
                        for (int ch = 0; ch < resampled->channels; ch++) {
                            memcpy(
                                    dst_samples + ch * dst_per_line_size + per_size_1line_pos,
                                    resampled->data[ch] + per_size_1line_pos,
                                    sniffG711CoreContext->m_dstFramePerSampleSize);
                        }
                    } // end for nb_samples

                    long decodeEndMS = getMillisecondTime();
                    int decodeCostMS = (int) (decodeEndMS - decodeStartMS);
#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)
                    EM_ASM_(
                            {
                                    postMessage(
                                            {
                                                    cmd:"go",
                                                    data: {
                                                            type: "decode_audio_g711",
                                                            corePtr: $0,
                                                            pcm: $1,
                                                            len: $2,
                                                            v_pts: $3,
                                                            tag: $4
                                                    }
                                            }
                                    );
                            },
                            sniffG711CoreContext,
                            dst_samples,
                            dst_total_size,
                            (double) sniffG711CoreContext->m_aFrame->pts / 1000.0,
                            decodeCostMS
                    );
#else
                    sniffG711CoreContext->pcmSamplesCallback(dst_samples,
                                                             dst_total_size,
                                                             (double) sniffG711CoreContext->m_aFrame->pts / 1000.0,
                                                             decodeCostMS);
#endif

                    hasYuv += 1;
                    // free
                    dst_per_line_size = 0;
                    dst_total_size = 0;
                    free(dst_samples);
                    dst_samples = NULL;
                } // ok
            } else {
                av_strerror(rec_re, szError, 256);
                // Resource temporarily unavailable
                printf("decode audio: rec_re ===========> error %d %s\n", rec_re, szError);
                break;
            }
        }

        if (hasYuv > 0) {
            // av_frame_unref(sniffG711CoreContext->m_aFrame);
            return MISSILE_PKT_GET_TYPE_PCM;
        }
    }

    return MISSILE_PKT_GET_NOTHING;
} // end _decodeAudioPkt





void *g711_decthread(void *arg) {
    SniffG711CoreContext *sniffG711CoreContext = (SniffG711CoreContext *) arg;
    if (sniffG711CoreContext == NULL) {
        return -1;
    }

    sniffG711CoreContext->m_threadRefresh = MISSILE_PTHREAD_ALREADY_CREATE;

    char szError[256] = {0};

    if (sniffG711CoreContext->m_formatCtx == NULL) {
        printf("read http live pkg error: format context param null\n");
        return -2;
    }

    if (sniffG711CoreContext->m_avPacket == NULL) {
        printf("read http live pkg error: packet param null\n");
        return -3;
    }

    if (sniffG711CoreContext->m_probe < 1) {
        printf("read http live pkg error: probe param null: %d\n", sniffG711CoreContext->m_probe);
        return -4;
    }

    //printf("debug start getPacketFunc\n");

    int ret = -1;
    while(1) {
        if (sniffG711CoreContext->m_threadRefresh == MISSILE_PTHREAD_WAIT_TO_RELEASE) {
            break;
        }

        printf("[console] read nal data for send start buf size:%zu\n", sniffG711CoreContext->m_bd.size);
        // size_t size_buf = sniffG711CoreContext->m_bd.size;
        if (sniffG711CoreContext->m_bd.size <= 0) {
            // printf("decode video: read g11a nal data for send start buf size:%zu\n", sniffG711CoreContext->m_bd.size);
            sleep(1); // debug
            continue;
        }

        ret = av_read_frame(sniffG711CoreContext->m_formatCtx, sniffG711CoreContext->m_avPacket);

        if (ret < 0) {
            // char szError[256] = {0};
            av_strerror(ret, szError, 256);
            printf(
                    "decode video: read g11a nal data for send is error: ret:%d, code:%s, msg:%s buf size:%zu\n",
                    ret, getCodeMsg(ret), szError, sniffG711CoreContext->m_bd.size);
            sleep(1); // debug
            continue;
        }

        if (sniffG711CoreContext->m_avPacket->stream_index == sniffG711CoreContext->m_videoIndex) {
            if (sniffG711CoreContext->m_vStartTime < 0) {
                sniffG711CoreContext->m_vStartTime =
                        (sniffG711CoreContext->m_avPacket->dts < sniffG711CoreContext->m_avPacket->pts) ?
                        sniffG711CoreContext->m_avPacket->dts : sniffG711CoreContext->m_avPacket->pts;
            }

            sniffG711CoreContext->m_avPacket->dts -= sniffG711CoreContext->m_vStartTime;
            sniffG711CoreContext->m_avPacket->pts -= sniffG711CoreContext->m_vStartTime;

            ret = _decodeVideoPkt(sniffG711CoreContext);

        } else if (sniffG711CoreContext->m_ignoreAudio == 0
                   && sniffG711CoreContext->m_avPacket->stream_index == sniffG711CoreContext->m_audioIndex) {
            //printf("Get Audio!\n");

            if (sniffG711CoreContext->m_aStartTime < 0) {
                sniffG711CoreContext->m_aStartTime =
                        (sniffG711CoreContext->m_avPacket->dts < sniffG711CoreContext->m_avPacket->pts) ?
                        sniffG711CoreContext->m_avPacket->dts : sniffG711CoreContext->m_avPacket->pts;
            }

            sniffG711CoreContext->m_avPacket->dts -= sniffG711CoreContext->m_aStartTime;
            sniffG711CoreContext->m_avPacket->pts -= sniffG711CoreContext->m_aStartTime;

            /*
             * Decode Audio Frame
             */
            ret = _decodeAudioPkt(sniffG711CoreContext);
        } else {
            ret = MISSILE_PKT_GET_NOTHING;
        }

        // av_packet_unref(sniffG711CoreContext->m_avPacket);
    } // end while read_frame

} // g711_decthread

/**
 *
 ************************************** @public functions
 ************************************** @member
 *
 */

/**
 *
 * @param sniffG711CoreContext
 * @param isRelease 0 no 1 yes
 * @return
 */
int g711_resetMembers(SniffG711CoreContext *sniffG711CoreContext, MISSILE_CMD_IS_RELEASE_TYPE isRelease) {
    printf("reset members with tag : %d\n", isRelease);
    // 防御性
    if (sniffG711CoreContext == NULL) {
        return -1;
    }
    int ret = 0;

    sniffG711CoreContext->m_mode              = MISSILE_SNIFFSTREAM_MODE_VOD;

    sniffG711CoreContext->m_probe             = 0;
    sniffG711CoreContext->isSetCallback       = 0;
    // set callback
    sniffG711CoreContext->probeCallback       = NULL;
    sniffG711CoreContext->yuvFrameCallback    = NULL;
    sniffG711CoreContext->pcmSamplesCallback  = NULL;

    // threads start
    {
        if (sniffG711CoreContext->m_threadRefresh == MISSILE_PTHREAD_ALREADY_CREATE &&
            isRelease == MISSILE_CMD_IS_RELEASE_YES)
        {
            sniffG711CoreContext->m_threadRefresh = MISSILE_PTHREAD_WAIT_TO_RELEASE;
            pthread_join(sniffG711CoreContext->m_decThread_0, NULL);
        }
        sniffG711CoreContext->m_threadRefresh = MISSILE_PTHREAD_WAIT_TO_CREATE;
    }
    // threads end

    //if (NULL != sniffG711CoreContext->m_pktNodeHead && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    sniffG711CoreContext->m_pktNodePtr = sniffG711CoreContext->m_pktNodeHead;
    //
    //    AVPktNode *tmpNode = NULL;
    //    while (NULL != sniffG711CoreContext->m_pktNodePtr) {
    //        av_packet_unref(sniffG711CoreContext->m_pktNodePtr->avPacket);
    //        sniffG711CoreContext->m_pktNodePtr->avPacket = NULL;
    //
    //        tmpNode = sniffG711CoreContext->m_pktNodePtr;
    //        sniffG711CoreContext->m_pktNodePtr = sniffG711CoreContext->m_pktNodePtr->next;
    //
    //        free(tmpNode);
    //        tmpNode = NULL;
    //    }
    //}
    //sniffG711CoreContext->m_pktNodePtr        = NULL;
    //sniffG711CoreContext->m_pktNodePlayPtr    = NULL;
    //sniffG711CoreContext->m_pktNodeHead       = NULL;

    //printf("START Release v frame\n");
    if (isRelease == MISSILE_CMD_IS_RELEASE_YES && NULL != sniffG711CoreContext->m_frame) {
        av_frame_free(&sniffG711CoreContext->m_frame);
    }
    sniffG711CoreContext->m_frame = NULL;
    if (isRelease == MISSILE_CMD_IS_RELEASE_YES && NULL != sniffG711CoreContext->m_aFrame) {
        av_frame_free(&sniffG711CoreContext->m_aFrame);
    }
    sniffG711CoreContext->m_aFrame = NULL;
    //printf("END Release v frame\n");

    if (isRelease == MISSILE_CMD_IS_RELEASE_YES && NULL != sniffG711CoreContext->m_swr_ctx) {
        swr_free(&sniffG711CoreContext->m_swr_ctx);
    }
    sniffG711CoreContext->m_swr_ctx = NULL;

    sniffG711CoreContext->m_dstFramePerSampleSize = 0;

    //if (NULL != sniffG711CoreContext->m_absFilter && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    av_bitstream_filter_close(sniffG711CoreContext->m_absFilter);
    //}
    if (NULL != sniffG711CoreContext->m_absCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_bsf_free(&sniffG711CoreContext->m_absCtx);
    }
    sniffG711CoreContext->m_absCtx = NULL;
    sniffG711CoreContext->m_absFilter = NULL;

    //printf("START Release vcodecCtx\n");
    if (NULL != sniffG711CoreContext->m_vCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffG711CoreContext->m_vCodecContext);
    }
    sniffG711CoreContext->m_vCodecContext = NULL;
    //printf("END Release vcodecCtx\n");

    //printf("START Release acodecCtx start\n");
    if (NULL != sniffG711CoreContext->m_aCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffG711CoreContext->m_aCodecContext);
    }
    sniffG711CoreContext->m_aCodecContext = NULL;
    //printf("END Release acodecCtx\n");


    if (NULL != sniffG711CoreContext->m_naluInfo && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        if (NULL != sniffG711CoreContext->m_naluInfo->vps) {
            free(sniffG711CoreContext->m_naluInfo->vps);
            sniffG711CoreContext->m_naluInfo->vps     = NULL;
            sniffG711CoreContext->m_naluInfo->vpsLen  = 0;
        }
        if (NULL != sniffG711CoreContext->m_naluInfo->sps) {
            free(sniffG711CoreContext->m_naluInfo->sps);
            sniffG711CoreContext->m_naluInfo->sps     = NULL;
            sniffG711CoreContext->m_naluInfo->spsLen  = 0;
        }
        if (NULL != sniffG711CoreContext->m_naluInfo->pps) {
            free(sniffG711CoreContext->m_naluInfo->pps);
            sniffG711CoreContext->m_naluInfo->pps     = NULL;
            sniffG711CoreContext->m_naluInfo->ppsLen  = 0;
        }
        if (NULL != sniffG711CoreContext->m_naluInfo->sei) {
            free(sniffG711CoreContext->m_naluInfo->sei);
            sniffG711CoreContext->m_naluInfo->sei     = NULL;
            sniffG711CoreContext->m_naluInfo->seiLen  = 0;
        }
        free(sniffG711CoreContext->m_naluInfo);
        sniffG711CoreContext->m_naluInfo->naluLen = 0;
    }
    sniffG711CoreContext->m_naluInfo = NULL;


    //sniffG711CoreContext->m_sampleBuf         = NULL;
    //sniffG711CoreContext->m_swrCtx            = NULL;
    sniffG711CoreContext->m_needSwr           = 0;

    // Outside MediaInfo
    sniffG711CoreContext->m_mediaInfo.fps             = -1;
    sniffG711CoreContext->m_mediaInfo.gop             = 0;
    sniffG711CoreContext->m_mediaInfo.a_duration      = -1;
    sniffG711CoreContext->m_mediaInfo.v_duration      = -1;
    sniffG711CoreContext->m_mediaInfo.duration        = -1;

    sniffG711CoreContext->m_mediaInfo.a_sample_rate   = 0;
    sniffG711CoreContext->m_mediaInfo.a_channel       = 0;
    sniffG711CoreContext->m_mediaInfo.a_sample_fmt    = NULL;
    sniffG711CoreContext->m_mediaInfo.a_out_sample_rate = 0;
    sniffG711CoreContext->m_mediaInfo.a_out_channel     = 0;
    sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt  = NULL;
    sniffG711CoreContext->m_mediaInfo.a_profile       = 2; // LC

    sniffG711CoreContext->m_mediaInfo.width           = 0;
    sniffG711CoreContext->m_mediaInfo.height          = 0;

    sniffG711CoreContext->m_vTimebase         = -1;
    sniffG711CoreContext->m_aTimebase         = -1;
    sniffG711CoreContext->m_vStartTime        = -1;
    sniffG711CoreContext->m_aStartTime        = -1;
    sniffG711CoreContext->m_videoIndex        = -1;
    sniffG711CoreContext->m_audioIndex        = -1;
    sniffG711CoreContext->m_vCodec            = V_CODEC_NAME_UNKN;
    sniffG711CoreContext->m_aCodec            = A_CODEC_NAME_UNKN;
    // sniffG711CoreContext->m_fps               = -1;
    sniffG711CoreContext->m_gop               = -1;

    //sniffG711CoreContext->m_buf               = NULL;
    //sniffG711CoreContext->m_bufLen            = 0;

    sniffG711CoreContext->m_ignoreAudio       = 0;

    //m_bd = {0};
    sniffG711CoreContext->m_bd.ptr = NULL;
    sniffG711CoreContext->m_bd.size = 0;
    sniffG711CoreContext->m_bd.total = 0;
    sniffG711CoreContext->m_bd.read_pos = 0;
    sniffG711CoreContext->m_bd_temp_ptr = NULL;

    //printf("START Release m_formatCtx\n");
    if (NULL != sniffG711CoreContext->m_formatCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        /**
         * 分析该函数分为三部分
            第一部分
            关闭输入：
                if (s->iformat)
                    if (s->iformat->read_close)
                        s->iformat->read_close(s);
            对于播放rtsp://admin:admin888@192.168.28.130:554/h264/ch1/main/av_stream，主要是发送TearDown指令给摄像机

            第二部分
            avio_close(pb)

            第三部分
            avformat_free_context(s)
            该函数的核心就是释放申请创建的视频和音频的流
             for (i = s->nb_streams - 1; i >= 0; i--)
                    ff_free_stream(s, s->streams[i]);
         */
        avformat_close_input(&sniffG711CoreContext->m_formatCtx);
    }
    sniffG711CoreContext->m_formatCtx = NULL;
    //printf("END Release m_formatCtx\n");

    sniffG711CoreContext->m_piFmt             = NULL;
    if (NULL != sniffG711CoreContext->m_avPacket && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_packet_unref(sniffG711CoreContext->m_avPacket);
    }
    sniffG711CoreContext->m_avPacket          = NULL;
    sniffG711CoreContext->m_pb                = NULL;

    // NALU LINK_LIST

    //printf("START Release m_missileAvYuvFrame\n");
    //cleanAvYuvFrame(sniffG711CoreContext, isRelease);
    //printf("END Release m_missileAvYuvFrame\n");

    return ret;
}

int g711_initFunc(SniffG711CoreContext *sniffG711CoreContext, MISSILE_SNIFFSTREAM_MODE mode) {
    if (sniffG711CoreContext == NULL) {
        return -1;
    }
    sniffG711CoreContext->introduceMineFunc();

    sniffG711CoreContext->m_mode = mode;

    //av_register_all();
    //avcodec_register_all();

    int ret = g711_resetMembers(sniffG711CoreContext, MISSILE_CMD_IS_RELEASE_NO);
    printf("VideoMissile g711 init done %d\n", ret);
    return ret;
}

int g711_releaseFunc(SniffG711CoreContext *sniffG711CoreContext) {
    int ret = g711_resetMembers(sniffG711CoreContext, MISSILE_CMD_IS_RELEASE_YES);
    printf("VideoMissile g711 release done %d\n", ret);
    return ret;
}

int g711_pushBufferFunc(
        SniffG711CoreContext *sniffG711CoreContext, uint8_t *buf, int buf_size, int probe_size) {
    if (buf_size < 0 || buf == NULL) {
        printf("=======g711_pushBufferFunc error buf empty\n");
        return 0;
    }
    // set point
    // copy to mem
    // printf("=======g711_pushBufferFunc start\n");
    //printf("probe size: %d\n", probe_size);

    if (sniffG711CoreContext != NULL) {
        if (sniffG711CoreContext->m_bd.ptr == NULL
            || sniffG711CoreContext->m_bd.size <= 0) {

            sniffG711CoreContext->m_bd.ptr = (uint8_t *) malloc(sizeof(uint8_t) * buf_size);
            sniffG711CoreContext->m_bd.size = buf_size;
            memcpy(sniffG711CoreContext->m_bd.ptr, buf, buf_size);
            //printf(">>>  memcpy done\n");
        } else {
            // remalloc
            //printf("start re malloc data %d\n", m_bd.size);
            uint8_t *dst = reMallocU8(
                    sniffG711CoreContext->m_bd.ptr, sniffG711CoreContext->m_bd.total, buf, buf_size);

            //printf("start re malloc free %p %d %d %d step %d %d\n",
            //       m_bd.ptr, m_bd.ptr[0], m_bd.ptr[1], m_bd.ptr[2], m_bd.ptr == NULL, m_bd.size);

            if (sniffG711CoreContext->m_bd.ptr != NULL) {
                free(sniffG711CoreContext->m_bd.ptr);
                sniffG711CoreContext->m_bd.ptr = NULL;
            }

            sniffG711CoreContext->m_bd.ptr = dst;
            sniffG711CoreContext->m_bd.size += buf_size;
            //printf("end re malloc done + %d = %d\n", buf_size, m_bd.size);
        }
    } else {
        printf("=======g711_pushBufferFunc error ptr empty\n");
        return -1;
    }
    sniffG711CoreContext->m_bd.total += buf_size;
    //printf("========> bd total: %d\n", sniffG711CoreContext->m_bd.total);

    int avRet = 0;
    // init
    if (sniffG711CoreContext != NULL && sniffG711CoreContext->m_piFmt == NULL) {
        sniffG711CoreContext->m_frame = av_frame_alloc();
        sniffG711CoreContext->m_aFrame = av_frame_alloc();
        //sniffG711CoreContext->m_aFrame = av_frame_alloc();
        //if (!sniffG711CoreContext->m_frame || !sniffG711CoreContext->m_aFrame) {
        if (!sniffG711CoreContext->m_frame || !sniffG711CoreContext->m_aFrame) {
            printf("av_frame_alloc-frame 初始化解码器失败\n");
            return -1;
        }

        uint8_t *bufPb = (uint8_t *)malloc(sizeof(uint8_t) * G711_BUF_SIZE);
        // run read_stream
        //sniffG711CoreContext->m_pb = avio_alloc_context(
        //        bufPb, G711_BUF_SIZE, 0, &m_bd, read_stream, NULL, NULL);
        //if (sniffG711CoreContext->m_mode == MISSILE_SNIFFSTREAM_MODE_LIVE) {
        sniffG711CoreContext->m_pb = avio_alloc_context(
                bufPb, G711_BUF_SIZE, 0, sniffG711CoreContext, g711_read_stream_live, NULL, NULL);
        //} else {
        //sniffG711CoreContext->m_pb = avio_alloc_context(
        //bufPb, G711_BUF_SIZE, 0, sniffG711CoreContext, read_stream_vod, NULL, NULL);
        //}

        avRet = av_probe_input_buffer(
                sniffG711CoreContext->m_pb, &sniffG711CoreContext->m_piFmt, "", NULL, 0, 4096);
        if (avRet < 0) {
            printf("probe format failed msg: %s, set default format to [FLV]\n",
                   getCodeMsg(avRet));
            sniffG711CoreContext->m_piFmt = av_find_input_format("flv"); // default is flv
            //return -1;
        } else {
            printf("format:%s[%s]\n", sniffG711CoreContext->m_piFmt->name,
                   sniffG711CoreContext->m_piFmt->long_name);
        }

        sniffG711CoreContext->m_formatCtx = avformat_alloc_context();
        sniffG711CoreContext->m_formatCtx->pb = sniffG711CoreContext->m_pb;
        sniffG711CoreContext->m_formatCtx->flags = AVFMT_FLAG_CUSTOM_IO;

        //sniffG711CoreContext->m_avPacket = (AVPacket *)av_malloc(sizeof(AVPacket));
        sniffG711CoreContext->m_avPacket = av_packet_alloc();
        av_init_packet(sniffG711CoreContext->m_avPacket);

    } // end check m_piFmt

    if (sniffG711CoreContext->m_probe < 1 && sniffG711CoreContext->m_bd.total >= probe_size) {

        // >= PROBE_SIZE
        //printf("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv\n");
        AVDictionary* options = NULL;
        av_dict_set(&options, "buffer_size", "409600", 0); //设置缓存大小，1080p可将值调大
        avRet = avformat_open_input(
                &sniffG711CoreContext->m_formatCtx, "", sniffG711CoreContext->m_piFmt, &options);
        //avRet = avformat_open_input(
        //        &sniffG711CoreContext->m_formatCtx, "", NULL, NULL);
        if (avRet != 0) {
            //iformat，priv_data赋值，pb, nbstreams,streams为null
            printf("Couldn't open input stream.（无法打开输入流）: %d, %s\n", avRet, getCodeMsg(avRet));
            return -2;
        }

        avRet = avformat_find_stream_info(sniffG711CoreContext->m_formatCtx, NULL);
        if (avRet < 0) {
            printf("Couldn't find stream information.（无法获取流信息）: %d %s\n", avRet, getCodeMsg(avRet));
            return -3;
        }

        av_dump_format(sniffG711CoreContext->m_formatCtx, 0, NULL, 0);

        sniffG711CoreContext->m_videoIndex = -1;
        int find = 0;
        for (int i = 0; i < sniffG711CoreContext->m_formatCtx->nb_streams; i++) {
            AVStream *contex_stream = sniffG711CoreContext->m_formatCtx->streams[i];
            enum AVCodecID codecId = contex_stream->codecpar->codec_id;

            if (contex_stream->codec->codec_type == AVMEDIA_TYPE_VIDEO) {
                sniffG711CoreContext->m_videoIndex = i;
                find += 1;

                if (codecId == AV_CODEC_ID_H265 || codecId == AV_CODEC_ID_HEVC) {
                    sniffG711CoreContext->m_vCodec = V_CODEC_NAME_HEVC;
                } else if (codecId == AV_CODEC_ID_H264) {
                    sniffG711CoreContext->m_vCodec = V_CODEC_NAME_AVC;
                }

                //if (sniffG711CoreContext->isSetCallback > 0) {
                //    sniffG711CoreContext->probeCallback(
                //            sniffG711CoreContext->m_mediaInfo.duration,
                //            sniffG711CoreContext->m_mediaInfo.width,
                //            sniffG711CoreContext->m_mediaInfo.height,
                //            sniffG711CoreContext->m_mediaInfo.fps,
                //            sniffG711CoreContext->m_mediaInfo.a_out_sample_rate,
                //            sniffG711CoreContext->m_mediaInfo.a_out_channel,
                //            sniffG711CoreContext->m_vCodec,
                //            sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt);
                //}

                sniffG711CoreContext->m_mediaInfo.width = contex_stream->codec->width;
                sniffG711CoreContext->m_mediaInfo.height = contex_stream->codec->height;
                sniffG711CoreContext->m_vTimebase = av_q2d(contex_stream->time_base);

                /*
                 * Decoder
                 */
                AVCodec *dec = avcodec_find_decoder(codecId);
                const char* codec_name = avcodec_get_name(codecId);
                printf("video codec name:%s\n", codec_name);
                //const char* codecName = avcodec_get_name(codecId);
                //const char *codec_name = avcodec_get_name(sniffG711CoreContext->m_vCodecContext->codec_id);
                if (!dec) {
                    printf("Failed to find decoder video for stream #%u codec:%s\n", i, codec_name);
                    //return AVERROR_DECODER_NOT_FOUND;
                } else {

                    // hard copy video codec name
                    //sniffG711CoreContext->m_vCodec = (char *) malloc(sizeof(codec_name));
                    //strcpy(sniffG711CoreContext->m_vCodec, codec_name);

                    sniffG711CoreContext->m_vCodecContext = avcodec_alloc_context3(dec);
                    if (!sniffG711CoreContext->m_vCodecContext) {
                        printf("Failed to allocate the video decoder context for stream #%u\n", i);
                        return AVERROR(ENOMEM);
                    }
                    sniffG711CoreContext->m_vCodecContext->thread_count = MISSILE_DEC_THREAD_COUNT;
                    sniffG711CoreContext->m_vCodecContext->thread_type = FF_THREAD_FRAME;
                    sniffG711CoreContext->m_vCodecContext->flags |= AV_CODEC_FLAG_TRUNCATED;

                    avRet = avcodec_parameters_to_context(
                            sniffG711CoreContext->m_vCodecContext, contex_stream->codecpar);
                    if (avRet < 0) {
                        printf("Failed to copy video decoder parameters to input decoder context "
                               "for stream #%u\n", i);
                        return avRet;
                    }

                    //const char *codec_name = avcodec_get_name(sniffG711CoreContext->m_vCodecContext->codec_id);
                    printf("video codec name:%s\n", codec_name);
                    if (avcodec_open2(sniffG711CoreContext->m_vCodecContext, dec, 0) < 0) {
                        printf("avcodec_open2 初始化解码器失败\n");
                        return -1;
                    }


                    if (contex_stream->duration < 0) {
                        //printf("debug contex_stream->duration < 0\n");
                        sniffG711CoreContext->m_mediaInfo.v_duration =
                                sniffG711CoreContext->m_formatCtx->duration / (double) AV_TIME_BASE;
                    } else {
                        //printf("debug contex_stream->duration >= 0\n");
                        sniffG711CoreContext->m_mediaInfo.v_duration =
                                contex_stream->duration * sniffG711CoreContext->m_vTimebase;
                    }

                    sniffG711CoreContext->m_mediaInfo.duration =
                            sniffG711CoreContext->m_mediaInfo.v_duration;
                    sniffG711CoreContext->m_mediaInfo.fps = av_q2d(contex_stream->r_frame_rate);

                    //printf("debug video duration param: \n"
                    //       "d:%lld,tb:%f, \n"
                    //       "d:%lld,tb:%d, \n"
                    //       "duration %f\n"
                    //       "duration %f\n",
                    //       contex_stream->duration, sniffG711CoreContext->m_vTimebase,
                    //       sniffG711CoreContext->m_formatCtx->duration, AV_TIME_BASE,
                    //       contex_stream->duration * sniffG711CoreContext->m_vTimebase,
                    //       sniffG711CoreContext->m_formatCtx->duration / (double)AV_TIME_BASE);
                } // end find decoder
            } // end AVMEDIA_TYPE_VIDEO

            if (contex_stream->codec->codec_type == AVMEDIA_TYPE_AUDIO) { // sniffG711CoreContext->m_ignoreAudio == 0 &&
                sniffG711CoreContext->m_audioIndex = i;
                find += 1;
                sniffG711CoreContext->m_aTimebase = av_q2d(contex_stream->time_base);

                //sniffG711CoreContext->m_formatCtx->
                //printf("debug audio sample rate: %d\n", contex_stream->codecpar->sample_rate);
                //printf("debug audio sample channels: %d\n", contex_stream->codecpar->channels);
                //printf("debug audio sample profile: %d\n", sniffG711CoreContext->);
                //printf("debug audio sample duration: %f\n", contex_stream->duration * sniffG711CoreContext->m_aTimebase);

                //enum AVSampleFormat sampleFormat = contex_stream->codec->sample_fmt;
                //const char *sample_fmt = av_get_sample_fmt_name(sampleFormat);
                //sniffG711CoreContext->m_mediaInfo.a_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                //strcpy(sniffG711CoreContext->m_mediaInfo.a_sample_fmt, sample_fmt);
                //
                //printf("debug audio sample fmt: %s\n", sniffG711CoreContext->m_mediaInfo.a_sample_fmt);
                //
                //sniffG711CoreContext->m_mediaInfo.a_sample_rate   = contex_stream->codecpar->sample_rate;
                //sniffG711CoreContext->m_mediaInfo.a_channel       = contex_stream->codecpar->channels;
                //sniffG711CoreContext->m_mediaInfo.a_profile       = contex_stream->codec->profile;

                // audio
                AVCodec *dec = avcodec_find_decoder(codecId);
                const char* codecName = avcodec_get_name(codecId);
                if (!dec) {
                    printf("Failed to find audio decoder for stream #%u codec:%s\n", i, codecName);
                    return AVERROR_DECODER_NOT_FOUND;
                }
                sniffG711CoreContext->m_aCodecContext = avcodec_alloc_context3(dec);
                if (!sniffG711CoreContext->m_aCodecContext) {
                    printf("Failed to allocate the audio decoder context for stream #%u\n", i);
                    return AVERROR(ENOMEM);
                }
                sniffG711CoreContext->m_aCodecContext->thread_count = MISSILE_DEC_THREAD_COUNT;
                sniffG711CoreContext->m_aCodecContext->thread_type = FF_THREAD_FRAME;
                sniffG711CoreContext->m_aCodecContext->flags |= AV_CODEC_FLAG_TRUNCATED;

                avRet = avcodec_parameters_to_context(
                        sniffG711CoreContext->m_aCodecContext, contex_stream->codecpar);
                if (avRet < 0) {
                    printf("Failed to copy audio decoder parameters to input decoder context "
                           "for stream #%u\n", i);
                    return avRet;
                }

                const char *codec_name = avcodec_get_name(sniffG711CoreContext->m_aCodecContext->codec_id);
                printf("audio codec name:%s\n", codec_name);
                if (avcodec_open2(
                        sniffG711CoreContext->m_aCodecContext, dec, NULL) < 0) {
                    printf("init decoder failed\n");
                    return -1;
                }

                // media sample format
                enum AVSampleFormat sampleFormat = sniffG711CoreContext->m_aCodecContext->sample_fmt;
                const char *sample_fmt = av_get_sample_fmt_name(sampleFormat);
                sniffG711CoreContext->m_mediaInfo.a_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                strcpy(sniffG711CoreContext->m_mediaInfo.a_sample_fmt, sample_fmt);

                // sample rate channel info
                sniffG711CoreContext->m_mediaInfo.a_sample_rate   = sniffG711CoreContext->m_aCodecContext->sample_rate;
                sniffG711CoreContext->m_mediaInfo.a_channel       = sniffG711CoreContext->m_aCodecContext->channels;
                sniffG711CoreContext->m_mediaInfo.a_profile       = sniffG711CoreContext->m_aCodecContext->profile;

                if (sampleFormat == AV_SAMPLE_FMT_FLTP) {
                    sniffG711CoreContext->m_needSwr = 0;
                    sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                    strcpy(sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt, sample_fmt);

                    // out sample rate channel info
                    sniffG711CoreContext->m_mediaInfo.a_out_sample_rate   = sniffG711CoreContext->m_aCodecContext->sample_rate;
                    sniffG711CoreContext->m_mediaInfo.a_out_channel       = sniffG711CoreContext->m_aCodecContext->channels;

                } else {
                    sniffG711CoreContext->m_needSwr = 1;
                    // out sample format
                    const char *sample_out_fmt = av_get_sample_fmt_name(G711_OUT_SAMPLE_FMT);
                    sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt = (char *) malloc(sizeof(sample_out_fmt));
                    strcpy(sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt, sample_out_fmt);

                    // out sample rate channel info
                    sniffG711CoreContext->m_mediaInfo.a_out_sample_rate   = G711_OUT_SAMPLE_RATE;
                    sniffG711CoreContext->m_mediaInfo.a_out_channel       = G711_OUT_CHANNEL_NB;
                }

                // duration
                if (contex_stream->duration < 0) {
                    sniffG711CoreContext->m_mediaInfo.a_duration = sniffG711CoreContext->m_mediaInfo.v_duration;
                } else {
                    sniffG711CoreContext->m_mediaInfo.a_duration =
                            contex_stream->duration * sniffG711CoreContext->m_aTimebase;
                }

                //printf("debug audio duration param: \nd:%lld,tb:%f, \nduration %f\n",
                //       contex_stream->duration, sniffG711CoreContext->m_vTimebase,
                //       contex_stream->duration * sniffG711CoreContext->m_vTimebase);
            }

            if (find >= 2) {
                sniffG711CoreContext->m_mediaInfo.duration =
                        MIN(sniffG711CoreContext->m_mediaInfo.v_duration, sniffG711CoreContext->m_mediaInfo.a_duration);
                av_dump_format(sniffG711CoreContext->m_formatCtx, 0, "", 0);
                break;
            }
        }

        if (sniffG711CoreContext->m_videoIndex == -1) {
            printf("Didn't find a video stream.\n");
            return -4;
        } else {
            printf("find video audio stream information %d %d\n",
                   sniffG711CoreContext->m_videoIndex, sniffG711CoreContext->m_audioIndex);
        }

        /*
         * nalu bsf
         */
        // mp4 to hevc nalu filter
        sniffG711CoreContext->m_absFilter = NULL;
        sniffG711CoreContext->m_absCtx = NULL;
        // /*
        sniffG711CoreContext->m_absFilter = (AVBitStreamFilter *)av_bsf_get_by_name("hevc_mp4toannexb");
        //过滤器分配内存
        av_bsf_alloc(sniffG711CoreContext->m_absFilter, &sniffG711CoreContext->m_absCtx);

        avcodec_parameters_copy(
                sniffG711CoreContext->m_absCtx->par_in,
                sniffG711CoreContext->m_formatCtx->streams[sniffG711CoreContext->m_videoIndex]->codecpar);
        av_bsf_init(sniffG711CoreContext->m_absCtx);
        // */

        /*
         * Probe Callback
         * sniffG711CoreContext->m_mediaInfo
         */
        if (sniffG711CoreContext->isSetCallback > 0) {
            printf("native------------------> probeCallback\n");
            sniffG711CoreContext->probeCallback(
                    sniffG711CoreContext->m_mediaInfo.duration,
                    sniffG711CoreContext->m_mediaInfo.width,
                    sniffG711CoreContext->m_mediaInfo.height,
                    sniffG711CoreContext->m_mediaInfo.fps,
                    sniffG711CoreContext->m_audioIndex,
                    sniffG711CoreContext->m_mediaInfo.a_out_sample_rate,
                    sniffG711CoreContext->m_mediaInfo.a_out_channel,
                    sniffG711CoreContext->m_vCodec,
                    sniffG711CoreContext->m_mediaInfo.a_out_sample_fmt);
        }

        sniffG711CoreContext->m_probe = 1;
        printf("native------------------> probe ret : %d\n", sniffG711CoreContext->m_probe);
#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)
        printf("native------------------> create thread\n");
        pthread_create(&sniffG711CoreContext->m_decThread_0, NULL, g711_decthread, sniffG711CoreContext);
#endif

        return 1;
    }

    //sniffG711CoreContext->getPacketFunc(sniffG711CoreContext, 1);
    return 0;
}


/**
 * setCodecTypeFunc
 * @param sniffG711CoreContext
 * @param callback
 * @return
 */
int g711_setSniffStreamCodecTypeFunc(
        SniffG711CoreContext *sniffG711CoreContext,
        long probeCallback, long yuvCallback, long pcmCallback,
        int ignoreAudio)
{
    sniffG711CoreContext->probeCallback = (G711_ProbeCallback) probeCallback;
    sniffG711CoreContext->yuvFrameCallback = (G711_YUVFrameCallback) yuvCallback;
    sniffG711CoreContext->pcmSamplesCallback = (G711_PCMSamplesCallback) pcmCallback;

    sniffG711CoreContext->isSetCallback = 1;
    sniffG711CoreContext->m_ignoreAudio = ignoreAudio;
    return 0;
}

int g711_getBufferLength(SniffG711CoreContext *sniffG711CoreContext) {
    return sniffG711CoreContext->m_bd.size;
}

int g711_decodeVideoFrameFunc(
        SniffG711CoreContext *sniffG711CoreContext) {
    // printf("decode video: read g11a nal data for send start buf size:%zu\n", sniffG711CoreContext->m_bd.size);

    if (sniffG711CoreContext->m_bd.size <= 0) {
        return MISSILE_PKT_GET_NOTHING;
    }

    int ret_rframe = av_read_frame(sniffG711CoreContext->m_formatCtx, sniffG711CoreContext->m_avPacket);
    char szError[256] = {0};

    if (ret_rframe < 0) {
        // char szError[256] = {0};
        av_strerror(ret_rframe, szError, 256);
        printf(
                "decode video: read g11a nal data for send error: ret:%d, code msg:%s, error msg:%s buf size:%zu\n",
                ret_rframe, getCodeMsg(ret_rframe), szError, sniffG711CoreContext->m_bd.size);

        // if (ret_rframe == AVERROR_EOF) {
        //     return G711_DECODE_EOF_CODE;
        // }
        // return -1;
        // sleep(1); // debug
        return MISSILE_PKT_GET_NOTHING;
    }

    int ret = 0;

    if (sniffG711CoreContext->m_avPacket->stream_index == sniffG711CoreContext->m_videoIndex) {
        //printf("debug Get Video! is key:%d\n", sniffG711CoreContext->m_avPacket->flags == AV_PKT_FLAG_KEY);
        //printf("debug start getPacketFunc 3\n");

        if (sniffG711CoreContext->m_vStartTime < 0) {
            sniffG711CoreContext->m_vStartTime =
                    (sniffG711CoreContext->m_avPacket->dts < sniffG711CoreContext->m_avPacket->pts) ?
                    sniffG711CoreContext->m_avPacket->dts : sniffG711CoreContext->m_avPacket->pts;
            //printf("debug m_vStartTime %f\n", sniffG711CoreContext->m_vStartTime * sniffG711CoreContext->m_vTimebase);
        }

        sniffG711CoreContext->m_avPacket->dts -= sniffG711CoreContext->m_vStartTime;
        sniffG711CoreContext->m_avPacket->pts -= sniffG711CoreContext->m_vStartTime;

        // BSF
        // ret = av_bsf_send_packet(sniffG711CoreContext->m_absCtx, sniffG711CoreContext->m_avPacket);
        // if (ret < 0) {
        //     av_strerror(ret, szError, 256);
        //     av_packet_unref(sniffG711CoreContext->m_avPacket);
        //     printf("send pack nalu error:%d %s", ret, szError);
        //
        //     continue;
        // } // av_bsf_send_packet
        // ret = av_bsf_receive_packet(sniffG711CoreContext->m_absCtx, sniffG711CoreContext->m_avPacket);
        // while (av_bsf_receive_packet(sniffG711CoreContext->m_absCtx, sniffG711CoreContext->m_avPacket) >= 0) {
        //     // av_strerror(ret, szError, 256);
        //     // av_packet_unref(sniffG711CoreContext->m_avPacket);
        //     // printf("recv nalu error:%d %s", ret, szError);
        //     //
        //     // continue;s
        //
        //     if (sniffG711CoreContext->m_avPacket->size > 0) {
        //         sniffG711CoreContext->m_avPacket->data[0] = G711_STARTCODE[0];
        //         sniffG711CoreContext->m_avPacket->data[1] = G711_STARTCODE[1];
        //         sniffG711CoreContext->m_avPacket->data[2] = G711_STARTCODE[2];
        //         sniffG711CoreContext->m_avPacket->data[3] = G711_STARTCODE[3];
        ret = _decodeVideoPkt(sniffG711CoreContext);
        //     }
        // } // av_bsf_receive_packet

        // if (sniffG711CoreContext->m_avPacket->size > 0) {
        //     sniffG711CoreContext->m_avPacket->data[0] = 0x00;
        //     sniffG711CoreContext->m_avPacket->data[1] = 0x00;
        //     sniffG711CoreContext->m_avPacket->data[2] = 0x00;
        //     sniffG711CoreContext->m_avPacket->data[3] = 0x01;
        //     ret = _decodeVideoPkt(sniffG711CoreContext);
        // }
        // av_packet_unref(sniffG711CoreContext->m_avPacket);

    } else if (sniffG711CoreContext->m_ignoreAudio == 0
               && sniffG711CoreContext->m_avPacket->stream_index == sniffG711CoreContext->m_audioIndex) {
        //printf("Get Audio!\n");

        if (sniffG711CoreContext->m_aStartTime < 0) {
            sniffG711CoreContext->m_aStartTime =
                    (sniffG711CoreContext->m_avPacket->dts < sniffG711CoreContext->m_avPacket->pts) ?
                    sniffG711CoreContext->m_avPacket->dts : sniffG711CoreContext->m_avPacket->pts;
            //printf("debug m_aStartTime %f\n", sniffG711CoreContext->m_aStartTime * sniffG711CoreContext->m_aTimebase);
        }

        sniffG711CoreContext->m_avPacket->dts -= sniffG711CoreContext->m_aStartTime;
        sniffG711CoreContext->m_avPacket->pts -= sniffG711CoreContext->m_aStartTime;

        /*
         * Decode Audio Frame
         */
        //printf("Get Audio!\n");
        ret = _decodeAudioPkt(sniffG711CoreContext);
    } else {
        ret = MISSILE_PKT_GET_NOTHING;
        //printf("Get Nothing!\n");
    }

    return ret;

    // av_packet_unref(sniffG711CoreContext->m_avPacket);
} // g711_decodeVideoFrameFunc


/**
 *
 ************************************** @outside functions
 *
 */
SniffG711CoreContext *newSniffG711CoreContext() {
    SniffG711CoreContext *sniffG711CoreContext =
            (SniffG711CoreContext *)malloc(sizeof(SniffG711CoreContext));

    sniffG711CoreContext->m_mode            = MISSILE_SNIFFSTREAM_MODE_VOD;
    sniffG711CoreContext->initFunc          = g711_initFunc;
    sniffG711CoreContext->releaseFunc       = g711_releaseFunc;
    sniffG711CoreContext->introduceMineFunc = introduce_mine;
    sniffG711CoreContext->pushBufferFunc    = g711_pushBufferFunc;
    sniffG711CoreContext->decodeVideoFrameFunc = g711_decodeVideoFrameFunc;
    sniffG711CoreContext->getBufferLength   = g711_getBufferLength;
    sniffG711CoreContext->setCodecTypeFunc  = g711_setSniffStreamCodecTypeFunc;
    return sniffG711CoreContext;
}

int releaseSniffG711CoreContext(SniffG711CoreContext *sniffG711CoreContext) {
    printf("exec release sniff stream ctx\n");
    if (sniffG711CoreContext == NULL) {
        return -1;
    }

    IS_INTRODUCE_MINE = 0;

    sniffG711CoreContext->m_threadRefresh = 1;
    int ret = sniffG711CoreContext->releaseFunc(sniffG711CoreContext);

    sniffG711CoreContext->initFunc          = NULL;
    sniffG711CoreContext->introduceMineFunc = NULL;
    sniffG711CoreContext->pushBufferFunc    = NULL;
    sniffG711CoreContext->decodeVideoFrameFunc = NULL;
    sniffG711CoreContext->getBufferLength   = NULL;
    sniffG711CoreContext->setCodecTypeFunc  = NULL;
    sniffG711CoreContext->releaseFunc       = NULL;

    printf("code of release sniff stream ctx:%d\n", ret);
    return ret;
}

