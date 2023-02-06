//
// Created by 小老虎 on 2020/10/11.
//
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif
// #include <pthread.h>
#include <unistd.h>

#include "sniff_stream.h"

#include "about.h"
#include "utils/tools.h"
#include "utils/av_err_code.h"
#include "utils/common_string.h"
#include "decoder/const_codec.h"

int debug_c = 0;

// debug
#include <libavutil/pixdesc.h>

/**
 *
 ********************************* Global Define Const Value @Private *************************
 *
 */
#define PROBE_SIZE          4096 * 1000
#define BUF_SIZE            4096
#define PUSH_UNIT           1
#define DEFAULT_SAMPLE_RATE 44100
#define DEFAULT_FPS         24

#define DECODE_EOF_CODE     -404
#define CODEC_NAME_LEN      128

const enum AVSampleFormat   OUT_SAMPLE_FMT  = AV_SAMPLE_FMT_FLTP;   // 输出的采样格式 16bit PCM
const int                   OUT_SAMPLE_RATE = 44100;                // 输出的采样率
/*
 * AV_CH_LAYOUT_MONO    单声道 NB = 1
 * AV_CH_LAYOUT_STEREO  双声道 NB = 2
 */
const uint64_t              OUT_CN_LAYOUT   = AV_CH_LAYOUT_MONO;    // 输出的声道布局
const int                   OUT_CHANNEL_NB  = 1;

const unsigned char         STARTCODE[4] = {0x00, 0x00, 0x00, 0x01};
const unsigned char         TEST_STARTCODE[4] = {0xEE, 0xEE, 0xEE, 1};

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
//SwrContext *swrCtx = NULL;
//FILE *testAPCM = NULL;
//FILE *testYUV = NULL;
//int countPCM = 0;
//int countYUV = 0;

/**
 *
 ********************************* Global Define Demux useful Value , @Private *************************
 *
 */
// Now is single thread, do not need lock/lock-free
SniffStreamContext *sniffStreamContextTempPtr = NULL;

/**
 *
 ************************************** @private functions
 ************************************** @member
 *
 */

//FILE *g_test_f_aac = NULL;
// typedef struct {
//     int write_adts;
//     int objecttype;
//     int sample_rate_index;
//     int channel_conf;
// } ADTSContext;
// ADTSContext               AdtsCtx;
#define  ADTS_HEADER_SIZE 8

// int aac_decode_extradata(ADTSContext *adts, unsigned char *pbuf, int bufsize)
// {
//     int aot, aotext, samfreindex;
//     int i, channelconfig;
//     unsigned char *p = pbuf;
//     if (!adts || !pbuf || bufsize<2)
//     {
//         return -1;
//     }
//     aot = (p[0]>>3)&0x1f;
//     if (aot == 31)
//     {
//         aotext = (p[0]<<3 | (p[1]>>5)) & 0x3f;
//         aot = 32 + aotext;
//         samfreindex = (p[1]>>1) & 0x0f;
//         if (samfreindex == 0x0f)
//         {
//             channelconfig = ((p[4]<<3) | (p[5]>>5)) & 0x0f;
//         }
//         else
//         {
//             channelconfig = ((p[1]<<3)|(p[2]>>5)) & 0x0f;
//         }
//     }
//     else
//     {
//         samfreindex = ((p[0]<<1)|p[1]>>7) & 0x0f;
//         if (samfreindex == 0x0f)
//         {
//             channelconfig = (p[4]>>3) & 0x0f;
//         }
//         else
//         {
//             channelconfig = (p[1]>>3) & 0x0f;
//         }
//     }
// #ifdef AOT_PROFILE_CTRL
//     if (aot < 2) aot = 2;
// #endif
//     adts->objecttype = aot-1;
//     adts->sample_rate_index = samfreindex;
//     adts->channel_conf = channelconfig;
//     adts->write_adts = 1;
//     return 0;
// }
//
// int aac_set_adts_head(ADTSContext *acfg, unsigned char *buf, int size)
// {
//     unsigned char byte;
//     if (size < ADTS_HEADER_SIZE)
//     {
//         return -1;
//     }
//     buf[0] = 0xff;
//     buf[1] = 0xf1;
//
//     byte = 0;
//     byte |= (acfg->objecttype & 0x03) << 6;
//     byte |= (acfg->sample_rate_index & 0x0f) << 2;
//     byte |= (acfg->channel_conf & 0x07) >> 2;
//     buf[2] = byte;
//
//     byte = 0;
//     byte |= (acfg->channel_conf & 0x07) << 6;
//     byte |= (ADTS_HEADER_SIZE + size) >> 11;
//     buf[3] = byte;
//
//     byte = 0;
//     byte |= (ADTS_HEADER_SIZE + size) >> 3;
//     buf[4] = byte;
//
//     byte = 0;
//     byte |= ((ADTS_HEADER_SIZE + size) & 0x7) << 5;
//     byte |= (0x7ff >> 6) & 0x1f;
//     buf[5] = byte;
//
//     byte = 0;
//     byte |= (0x7ff & 0x3f) << 2;
//     buf[6] = byte;
//
//     return 0;
// }

/**
 *
 * @param sniffStreamContext
 * @param isRelease 0 no 1 yes
 * @return
 */
//void cleanAvYuvFrame(SniffStreamContext *sniffStreamContext, MISSILE_CMD_IS_RELEASE_TYPE isRelease) {
//    if (NULL != sniffStreamContext->m_missileAvYuvFrame.luma && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
//        free(sniffStreamContext->m_missileAvYuvFrame.luma);
//    }
//    sniffStreamContext->m_missileAvYuvFrame.luma = NULL;
//
//    if (NULL != sniffStreamContext->m_missileAvYuvFrame.chromaB && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
//        free(sniffStreamContext->m_missileAvYuvFrame.chromaB);
//    }
//    sniffStreamContext->m_missileAvYuvFrame.chromaB = NULL;
//
//    if (NULL != sniffStreamContext->m_missileAvYuvFrame.chromaR && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
//        free(sniffStreamContext->m_missileAvYuvFrame.chromaR);
//    }
//    sniffStreamContext->m_missileAvYuvFrame.chromaR = NULL;
//}

/**
 * 实质进行的是读取已有内存的size数据，拷贝到buf中。opaque方便参数传递。注意，在拷贝时要对pos累加。
 * @param opaque
 * @param buf
 * @param buf_size
 * @return
 */
int read_stream_vod(void *opaque, uint8_t *buf, int buf_size)
{
    SniffStreamContext *sniffStreamContext = (SniffStreamContext *)opaque;

    //printf("start read_stream - bd ptr:%p bd size:%d\n",
    //       sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.size);

    buf_size = FFMIN(buf_size, sniffStreamContext->m_bd.size);

    if (!buf_size) {
        printf("read_stream error - bd ptr:%p bd size:%d, buf_size:%d ERROR EOF\n",
               sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.size, buf_size);
        return AVERROR_EOF;
    }
    //printf("read_stream - ptr:%p consume:%d size:%zu pos:%d total:%d\n",
    //        m_bd.ptr, buf_size, m_bd.size, m_bd.read_pos, m_bd.file_size);

    /* copy internal buffer data to buf */
    //memcpy(buf, m_bd.ptr, buf_size);
    //printf("read_stream - start memcpy\n");

    sniffStreamContext->m_bd_temp_ptr = sniffStreamContext->m_bd.ptr + sniffStreamContext->m_bd.read_pos;
    memcpy(buf, sniffStreamContext->m_bd_temp_ptr, buf_size);

    //printf("1");
    //sniffStreamContext->m_bd.ptr += buf_size;
    //memcpy(buf, sniffStreamContext->m_bd.ptr, buf_size);

    //printf("2");
    sniffStreamContext->m_bd.read_pos += buf_size;

    //m_bd.ptr = m_bd.ptr + buf_size;
    //m_bd_temp_ptr = m_bd.ptr + sniffStreamContextTempPtr->m_bd.read_pos;

    //printf("3");
    sniffStreamContext->m_bd.size -= buf_size;

    //printf("4\n");
    //printf("read_stream - bd ptr:%p bd size:%d, buf_size:%d\n", m_bd.ptr, m_bd.size, buf_size);
    return buf_size;
}

/**
 * 实质进行的是读取已有内存的size数据，拷贝到buf中。opaque方便参数传递。注意，在拷贝时要对pos累加。
 * @param opaque
 * @param buf
 * @param buf_size
 * @return
 */
int read_stream_live(void *opaque, uint8_t *buf, int buf_size)
{
    //struct buffer_data *bd = (struct buffer_data *)opaque;
    //buf_size = FFMIN(buf_size, bd->size);
    SniffStreamContext *sniffStreamContext = (SniffStreamContext *)opaque;

    //printf("before read_stream FFMIN - bd ptr:%p size:%zu, buf_size:%d\n",
    //       sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.size, buf_size);

    buf_size = FFMIN(buf_size, sniffStreamContext->m_bd.size);

    //printf("after read_stream FFMIN - bd ptr:%p size:%zu, buf_size:%d MIN:%lu\n",
    //       sniffStreamContext->m_bd.ptr,
    //       sniffStreamContext->m_bd.size,
    //       buf_size,
    //       FFMIN(buf_size, sniffStreamContext->m_bd.size));

    if (!buf_size) {
        printf("read_stream - bd ptr:%p bd size:%zu, buf_size:%d ERROR EOF\n",
               sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.size, buf_size);
        return AVERROR_EOF;
    }
    //printf("read_stream - ptr:%p consume:%d size:%zu pos:%d total:%d\n",
    //        m_bd.ptr, buf_size, m_bd.size, m_bd.read_pos, m_bd.file_size);

    /* copy internal buffer data to buf */
    //memcpy(buf, m_bd.ptr, buf_size);
    //printf("read_stream - start memcpy\n");
    sniffStreamContext->m_bd_temp_ptr = sniffStreamContext->m_bd.ptr + sniffStreamContext->m_bd.read_pos;

    memcpy(buf, sniffStreamContext->m_bd_temp_ptr, buf_size);
    sniffStreamContext->m_bd.read_pos += buf_size;

    // patch
    int dstLen = sniffStreamContext->m_bd.file_size - buf_size;
    uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
    int rmRet = removeMallocU8(
            sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.file_size, dst, buf_size, dstLen);

    free(sniffStreamContext->m_bd.ptr);
    sniffStreamContext->m_bd.ptr = dst;
    sniffStreamContext->m_bd.file_size = dstLen;
    sniffStreamContext->m_bd.read_pos = 0;
    sniffStreamContext->m_bd_temp_ptr = NULL;

    //m_bd.ptr = m_bd.ptr + buf_size;
    //m_bd_temp_ptr = m_bd.ptr + sniffStreamContextTempPtr->m_bd.read_pos;

    //sniffStreamContext->m_bd.size -= buf_size;
    sniffStreamContext->m_bd.size = dstLen;

    //printf("read_stream - bd ptr:%p bd total_size:%d size:%zu, buf_size:%d, ret:%d\n",
    //        sniffStreamContext->m_bd.ptr,
    //        sniffStreamContext->m_bd.file_size,
    //        sniffStreamContext->m_bd.size,
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
int64_t seek_in_buffer(void *opaque, int64_t offset, int whence)
{
    SniffStreamContext *sniffStreamContext = (SniffStreamContext *)opaque;
    int64_t ret = -1;

    //printf("whence=%d , offset=%lld , file_size=%ld\n",
    //       whence, offset, sniffStreamContext->m_bd.file_size);
    switch (whence)
    {
        case AVSEEK_SIZE:
            //printf("AVSEEK_SIZE:%d\n", sniffStreamContext->m_bd.file_size);
            ret = sniffStreamContext->m_bd.file_size;
            break;
        case SEEK_SET:
            //printf("SEEK_SET\n");
            sniffStreamContext->m_bd.seek_ptr = sniffStreamContext->m_bd.ptr + offset;
            sniffStreamContext->m_bd.size = sniffStreamContext->m_bd.file_size - offset;
            sniffStreamContext->m_bd.read_pos = offset;
            ret = sniffStreamContext->m_bd.seek_ptr;
            break;
    }
    return ret;
}

/**
 *
 ************************************** @public functions
 ************************************** @member
 *
 */
//void introduceMineFunc() {
//    introduce_mine();
//}

// void *myThread(void *arg) {
//     SniffStreamContext *sniffStreamContext = (SniffStreamContext *) arg;
//     EM_ASM(alert("myThread111"));
//     EM_ASM_(
//             {
//                     console.log("myThread111", $0);
//             },
//             222
//     );
//     EM_ASM(
//             postMessage({cmd:"go", data:"myThread go"});
//     );
//     double start_v = sniffStreamContext->m_vStartTime * sniffStreamContext->m_vTimebase;
//     while(1) {
//         int ret = sniffStreamContext->getPacketFunc(sniffStreamContext, 1, 0);
//
//         if (ret == MISSILE_PKT_GET_TYPE_HAVE_VIDEO || ret == MISSILE_PKT_GET_TYPE_YUV || ret == MISSILE_PKT_GET_TYPE_AAC) {
//             EM_ASM_(
//                     {
//                             console.log("myThread nalu", $0);
//                     },
//                     ret
//             );
//
//         } else if (ret == MISSILE_PKT_GET_NOTHING || ret < 0) {
//             // start_v -
//             double end_diff_check =
//                     sniffStreamContext->m_mediaInfo.v_duration - sniffStreamContext->m_frameDuration -
//                     sniffStreamContext->m_decLastPTS;
//
//             printf("debug myThread sniffStreamContext->getPacketFunc %f - %f - %f = %f <= %f\n",
//                    sniffStreamContext->m_mediaInfo.v_duration,
//                     // start_v,
//                    sniffStreamContext->m_frameDuration,
//                    sniffStreamContext->m_decLastPTS,
//                    end_diff_check,
//                    sniffStreamContext->m_frameDuration);
//             if (end_diff_check <= sniffStreamContext->m_frameDuration) {
//                 EM_ASM_(
//                         {
//                                 console.log("myThread EXIT", $0);
//                         },
//                         ret
//                 );
//                 EM_ASM_(
//                         {
//                                 postMessage(
//                                         {
//                                                 cmd: "goexit",
//                                                 data: {
//                                                         corePtr: $0
//                                                 }
//                                         }
//                                 );
//                         },
//                         sniffStreamContext
//                 );
//                 break;
//             }
//         }
//         // EM_ASM_(
//         //         {
//         //             console.log("myThread nalu", $0);
//         //         },
//         //         ret
//         // );
//         // EM_ASM_(
//         //         {
//         //             postMessage({cmd:"go", data:"myThread go ret:" + $0});
//         //         },
//         //         ret
//         // );
//         // sleep(1);
//     }
//
//     pthread_exit(0);
// } // myThread

void *decThread(void *arg) {
    SniffStreamContext *sniffStreamContext = (SniffStreamContext *) arg;
    sniffStreamContext->m_threadRefresh = MISSILE_PTHREAD_ALREADY_CREATE;
    // EM_ASM(alert("decThread111"));
    // EM_ASM_(
    //         {
    //                 console.log("decThread111", $0);
    //         },
    //         222
    // );
    // EM_ASM(
    //         postMessage({cmd:"dec", data:"decThread go"});
    // );

    char szError[256] = {0};

    AV_DEC_Nalu_Node *node = NULL;
    while(1) {
        if (sniffStreamContext == NULL || sniffStreamContext->m_threadRefresh == MISSILE_PTHREAD_WAIT_TO_RELEASE) {
            break;
        }
        if (node != NULL) {
            int ret_free_node = AV_DEC_NaluNode_Release(node);
            // printf("nalu LList length 2:%zu ret:%d\n", sniffStreamContext->m_avDecNaluLinkList->length, ret_free_node);
            node = NULL;
        }

        node = AV_DEC_NaluNode_Pop_1st(sniffStreamContext->m_avDecNaluLinkList);
        if (node == NULL) {
            // sleep(1);
            continue;
        } else {
            // int ret_free_node = AV_DEC_NaluNode_Release(node);
            // printf("nalu LList length 2:%zu ret:%d\n", sniffStreamContext->m_avDecNaluLinkList->length, ret_free_node);
        }

        sniffStreamContext->m_decPacket->data = node->buff;
        sniffStreamContext->m_decPacket->size = node->len;
        sniffStreamContext->m_decPacket->pts = node->pts;
        sniffStreamContext->m_decPacket->dts = node->dts;
        sniffStreamContext->m_decPacket->tag = node->tag;
        sniffStreamContext->m_decPacket->skip = node->skip;

        //int frameFinished = -1;
        //int rec_re = avcodec_decode_video2(
        //        sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_frame,
        //        &frameFinished, sniffStreamContext->m_decPacket);

        // int sendRet = avcodec_send_packet(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_decPacket);
        // double pts_d = (double) sniffStreamContext->m_decPacket->pts / 1000.0;
        int sendRet = avcodec_send_packet(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_decPacket);

        if (sendRet == AVERROR(EAGAIN)) {
            printf("sendRet ===========> EAGAIN\n");

            av_strerror(sendRet, szError, 256);
            printf("[x] Decode Failed! pts:%lld dts:%lld step0.0 : %d, %s\n", sniffStreamContext->m_decPacket->pts,
                   sniffStreamContext->m_decPacket->dts, sendRet, szError);
            // return MISSILE_PKT_GET_NOTHING;
            continue;
        } else if (sendRet == AVERROR_EOF) {
            printf("sendRet ===========> AVERROR_EOF\n");

            av_strerror(sendRet, szError, 256);
            printf("[x] Decode Failed! pts:%lld dts:%lld step0.0 : %d, %s\n", sniffStreamContext->m_decPacket->pts,
                   sniffStreamContext->m_decPacket->dts, sendRet, szError);
            // return MISSILE_PKT_GET_NOTHING;
            continue;
        } else if (sendRet == AVERROR(EINVAL)) {
            printf("sendRet ===========> EINVAL\n");

            av_strerror(sendRet, szError, 256);
            printf("[x] Decode Failed! pts:%lld dts:%lld step0.0 : %d, %s\n", sniffStreamContext->m_decPacket->pts,
                   sniffStreamContext->m_decPacket->dts, sendRet, szError);
            // return MISSILE_PKT_GET_NOTHING;
            continue;
        } else if (sendRet == AVERROR(ENOMEM)) {
            printf("sendRet ===========> ENOMEM\n");

            av_strerror(sendRet, szError, 256);
            printf("[x] Decode Failed! pts:%lld dts:%lld step0.0 : %d, %s\n", sniffStreamContext->m_decPacket->pts,
                   sniffStreamContext->m_decPacket->dts, sendRet, szError);
            // return MISSILE_PKT_GET_NOTHING;
            continue;
        } else {
            // printf("sendRet ===========> %d\n", sendRet);
        }

        int hasYuv = 0;
        if (sendRet == 0) {
            int rec_re = 0;
            while (1) {
                rec_re = avcodec_receive_frame(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_frame);
                if (rec_re == 0) {

                    // debug
                    /*
                    //if (debug_c <= 0) {
                    //    FILE *g_test_f_yuv = fopen("./result_yuv420p10le.yuv", "wb");
                    //    int sizedebug = sniffStreamContext->m_frame->width * 1920 * 3;
                    //    printf("===============> DEBUG %s linesize:%d %d %d wh:%d %d\n",
                    //            av_get_pix_fmt_name(sniffStreamContext->m_vDecCodecContext->pix_fmt),
                    //            sniffStreamContext->m_frame->linesize[0],
                    //            sniffStreamContext->m_frame->linesize[1],
                    //            sniffStreamContext->m_frame->linesize[2],
                    //            sniffStreamContext->m_frame->width, sniffStreamContext->m_frame->height);
                    //    fwrite(sniffStreamContext->m_frame->data, 1,
                    //           sizedebug,
                    //            g_test_f_yuv);
                    //    fclose(g_test_f_yuv);
                    //    debug_c += 1;
                    //}
                     */

                    if (sniffStreamContext->m_decPacket->skip > 0) {
                        // skip
                        double pts_d = (double) sniffStreamContext->m_decPacket->pts / 1000.0;
                        sniffStreamContext->m_seekDesc.m_seekBusyPos = pts_d;

                    } else {
                        /*
                        if (sniffStreamContext->m_swCtx == NULL) {
                            sniffStreamContext->m_swCtx = sws_getContext(
                                    sniffStreamContext->m_mediaInfo.width, sniffStreamContext->m_mediaInfo.height,
                                    sniffStreamContext->m_vDecCodecContext->pix_fmt, // in ,vcodec->frame->format
                                    sniffStreamContext->m_mediaInfo.width, sniffStreamContext->m_mediaInfo.height,
                                    AV_PIX_FMT_RGBA, // out AV_PIX_FMT_RGB24
                                    SWS_FAST_BILINEAR, NULL, NULL, NULL); // liner algorithm SWS_BICUBIC
                        }
                        if (sniffStreamContext->m_outFrame == NULL) {
                            sniffStreamContext->m_outFrame = av_frame_alloc();
                            if (!sniffStreamContext->m_outFrame) {
                                printf("av_frame_alloc-out frame 初始化失败\n");
                                return -1;
                            }
                        }

                        // Frames
                        uint8_t *out_buffer = NULL;
                        int wh_size = sniffStreamContext->m_frame->width * sniffStreamContext->m_frame->height;

                        sniffStreamContext->m_outFrame->width = sniffStreamContext->m_frame->width;
                        sniffStreamContext->m_outFrame->height = sniffStreamContext->m_frame->height;
                        sniffStreamContext->m_outFrame->format =  AV_PIX_FMT_RGBA; // out AV_PIX_FMT_RGB24

                        out_buffer = (uint8_t *) av_malloc((int) (wh_size * 4.0) * sizeof(uint8_t));
                        avpicture_fill(
                                (AVPicture *) sniffStreamContext->m_outFrame, out_buffer,
                                AV_PIX_FMT_RGBA,
                                sniffStreamContext->m_outFrame->width, sniffStreamContext->m_outFrame->height);

                        sws_scale(sniffStreamContext->m_swCtx,
                                  (const uint8_t *const *) sniffStreamContext->m_frame->data,
                                  sniffStreamContext->m_frame->linesize, // (const uint8_t* const*)
                                  0, sniffStreamContext->m_frame->height,
                                  sniffStreamContext->m_outFrame->data,
                                  sniffStreamContext->m_outFrame->linesize);
                        */

                        // printf("debug +++++ receive frame pts:%lld\n", sniffStreamContext->m_frame->pts);
                        if (sniffStreamContext->isSetCallback > 0) {
                            // //printf("debug %d %d %d\n",
                            // //       sniffStreamContext->m_frame->linesize[0],
                            // //       sniffStreamContext->m_frame->linesize[1],
                            // //       sniffStreamContext->m_frame->linesize[2]);

                            // EM_ASM(alert("decThread get yuv"));

                            EM_ASM_(
                                    {
                                            postMessage(
                                                    {
                                                            cmd:"go",
                                                            data: {
                                                                    type: "decode_video",
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
                                    sniffStreamContext,
                                    sniffStreamContext->m_frame->data[0],
                                    sniffStreamContext->m_frame->data[1],
                                    sniffStreamContext->m_frame->data[2],
                                    sniffStreamContext->m_frame->linesize[0],
                                    sniffStreamContext->m_frame->linesize[1],
                                    sniffStreamContext->m_frame->linesize[2],
                                    sniffStreamContext->m_mediaInfo.width,
                                    sniffStreamContext->m_mediaInfo.height,
                                    (double) sniffStreamContext->m_frame->pts / 1000.0,
                                    sniffStreamContext->m_decPacket->tag
                            );

                            // sniffStreamContext->yuvFrameCallback(sniffStreamContext->m_frame->data[0],
                            //                                      sniffStreamContext->m_frame->data[1],
                            //                                      sniffStreamContext->m_frame->data[2],
                            //                                      sniffStreamContext->m_frame->linesize[0],
                            //                                      sniffStreamContext->m_frame->linesize[1],
                            //                                      sniffStreamContext->m_frame->linesize[2],
                            //                                      sniffStreamContext->m_mediaInfo.width,
                            //                                      sniffStreamContext->m_mediaInfo.height,
                            //                                      (double) sniffStreamContext->m_frame->pts / 1000.0,
                            //                                      tag);
                            //
                            // //sniffStreamContext->rgb24FrameCallback(sniffStreamContext->m_outFrame->data[0],
                            // //                                       sniffStreamContext->m_outFrame->linesize[0],
                            // //                                       sniffStreamContext->m_mediaInfo.width,
                            // //                                       sniffStreamContext->m_mediaInfo.height,
                            // //        //(double) sniffStreamContext->m_frame->pts / 1000.0,
                            // //                                       pts_d,
                            // //                                       tag);
                            hasYuv += 1;
                            // } // ok

                            //av_free(out_buffer);
                            //out_buffer = NULL;

                        } // Decode callback
                    } // skip
                } else {
                    if (hasYuv <= 0) {
                        av_strerror(rec_re, szError, 256);
                        printf("[x] Decode Failed! pts:%lld dts:%lld , step1.0 error: %d, %s\n",
                               sniffStreamContext->m_decPacket->pts, sniffStreamContext->m_decPacket->dts,
                               rec_re, szError);
                    }
                    break;
                } // end rec_re === 0
            } // end while

            av_packet_unref(sniffStreamContext->m_decPacket);

            if (hasYuv > 0) {
                // return MISSILE_PKT_GET_TYPE_YUV;
                continue;
            }
        } else {
            // return MISSILE_PKT_GET_NOTHING;
            continue;
        }
        /*
        //if (rec_re < 0) {
        //    //av_free_packet(vcodecer->avPacket);
        //    av_strerror(rec_re, szError, 256);
        //    printf("[x] Decode Failed! 0.1 : %d, %s\n", rec_re, szError);
        //    return rec_re;
        //}
        //
        //if (frameFinished && sniffStreamContext->isSetCallback > 0) {
        //    sniffStreamContext->yuvFrameCallback(sniffStreamContext->m_frame->data[0],
        //                                         sniffStreamContext->m_frame->data[1],
        //                                         sniffStreamContext->m_frame->data[2],
        //                                         sniffStreamContext->m_frame->linesize[0],
        //                                         sniffStreamContext->m_frame->linesize[1],
        //                                         sniffStreamContext->m_frame->linesize[2],
        //                                         sniffStreamContext->m_mediaInfo.width,
        //                                         sniffStreamContext->m_mediaInfo.height,
        //                                         (double) sniffStreamContext->m_frame->pts / 1000.0);
        //    return MISSILE_PKT_GET_TYPE_YUV;
        //} // ok

        //if (NULL != sniffStreamContext->m_pktNodeHead) {
        //    if (sniffStreamContext->m_pktNodePlayPtr == NULL) {
        //        sniffStreamContext->m_pktNodePlayPtr = sniffStreamContext->m_pktNodeHead;
        //    }
        //
        //    sniffStreamContext->m_pktNodePlayPtr = sniffStreamContext->m_pktNodePlayPtr;
        //
        //    AVPacket *pkt = sniffStreamContext->m_pktNodePlayPtr->avPacket;
        //
        //    // do
        //    int frameFinished = 0;
        //    // 解码
        //    int recvRet = avcodec_decode_video2(
        //            sniffStreamContext->m_vCodecContext, sniffStreamContext->m_frame, &frameFinished, pkt);
        //    //int recvRet = avcodec_receive_frame(sniffStreamContext->m_vCodecContext, sniffStreamContext->m_frame);
        //    //printf("recvRet ===========> %d\n", recvRet);
        //
        //    //double vTime = pkt->pts * sniffStreamContext->m_vTimebase;
        //
        //    if (frameFinished && sniffStreamContext->isSetCallback > 0) {
        //    //if (recvRet >= 0 && sniffStreamContext->isSetCallback > 0) {
        //        sniffStreamContext->yuvFrameCallback(sniffStreamContext->m_frame->data[0],
        //                                             sniffStreamContext->m_frame->data[1],
        //                                             sniffStreamContext->m_frame->data[2],
        //                                             sniffStreamContext->m_frame->linesize[0],
        //                                             sniffStreamContext->m_frame->linesize[1],
        //                                             sniffStreamContext->m_frame->linesize[2],
        //                                             sniffStreamContext->m_mediaInfo.width,
        //                                             sniffStreamContext->m_mediaInfo.height,
        //                                             sniffStreamContext->m_frame->pts * sniffStreamContext->m_vTimebase);
        //    } // ok
        //
        //    // next frame
        //    sniffStreamContext->m_pktNodePlayPtr = sniffStreamContext->m_pktNodePlayPtr->next;
        //    return MISSILE_PKT_GET_TYPE_YUV;
        //}
        */

        // return MISSILE_PKT_GET_NOTHING;

    } // end while thread

    // pthread_exit(0);

} // decThread

/**
 *
 * @param sniffStreamContext
 * @param isRelease 0 no 1 yes
 * @return
 */
int resetMembers(SniffStreamContext *sniffStreamContext, MISSILE_CMD_IS_RELEASE_TYPE isRelease) {
    printf("reset members with tag : %d\n", isRelease);
    // 防御性
    if (sniffStreamContext == NULL) {
        return -1;
    }
    int ret = 0;

    // threads start
    {
        if (sniffStreamContext->m_threadRefresh == MISSILE_PTHREAD_ALREADY_CREATE &&
            isRelease == MISSILE_CMD_IS_RELEASE_YES)
        {
            sniffStreamContext->m_threadRefresh = MISSILE_PTHREAD_WAIT_TO_RELEASE;
            pthread_join(sniffStreamContext->m_decThread_0, NULL);
        }
        sniffStreamContext->m_threadRefresh = MISSILE_PTHREAD_WAIT_TO_CREATE;
    }
    // threads end

    sniffStreamContext->m_mode              = MISSILE_SNIFFSTREAM_MODE_VOD;

    // Callback
    {
        sniffStreamContext->m_probe = 0;
        sniffStreamContext->m_probeRetry = 0;
        sniffStreamContext->isSetCallback = 0;
        // set callback
        sniffStreamContext->probeCallback = NULL;
        sniffStreamContext->yuvFrameCallback    = NULL;
        //sniffStreamContext->rgb24FrameCallback = NULL;
        sniffStreamContext->naluFrameCallback = NULL;
        sniffStreamContext->pcmSamplesCallback = NULL;
        sniffStreamContext->aacSamplesCallback = NULL;
    }

    //if (NULL != sniffStreamContext->m_pktNodeHead && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    sniffStreamContext->m_pktNodePtr = sniffStreamContext->m_pktNodeHead;
    //
    //    AVPktNode *tmpNode = NULL;
    //    while (NULL != sniffStreamContext->m_pktNodePtr) {
    //        av_packet_unref(sniffStreamContext->m_pktNodePtr->avPacket);
    //        sniffStreamContext->m_pktNodePtr->avPacket = NULL;
    //
    //        tmpNode = sniffStreamContext->m_pktNodePtr;
    //        sniffStreamContext->m_pktNodePtr = sniffStreamContext->m_pktNodePtr->next;
    //
    //        free(tmpNode);
    //        tmpNode = NULL;
    //    }
    //}
    //sniffStreamContext->m_pktNodePtr        = NULL;
    //sniffStreamContext->m_pktNodePlayPtr    = NULL;
    //sniffStreamContext->m_pktNodeHead       = NULL;

    //printf("START Release v frame\n");
    if (NULL != sniffStreamContext->m_frame && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_frame_free(&sniffStreamContext->m_frame);
    }
    sniffStreamContext->m_frame = NULL;
    //printf("END Release v frame\n");

    //if (NULL != sniffStreamContext->m_outFrame && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    av_frame_free(&sniffStreamContext->m_outFrame);
    //}
    //sniffStreamContext->m_outFrame = NULL;
    //printf("END Release v frame\n");

    //if (NULL != sniffStreamContext->m_absFilter && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    av_bitstream_filter_close(sniffStreamContext->m_absFilter);
    //}
    if (NULL != sniffStreamContext->m_absCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_bsf_free(&sniffStreamContext->m_absCtx);
    }
    sniffStreamContext->m_absCtx = NULL;
    sniffStreamContext->m_absFilter = NULL;



    //printf("Release a frame start\n");
    //if (NULL != sniffStreamContext->m_aFrame) {
    //    av_frame_free(&sniffStreamContext->m_aFrame);
    //}
    //sniffStreamContext->m_aFrame = NULL;
    //printf("Release a frame finished\n");

    //printf("START Release vcodecCtx\n");
    if (NULL != sniffStreamContext->m_vCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffStreamContext->m_vCodecContext);
    }
    sniffStreamContext->m_vCodecContext = NULL;
    //printf("END Release vcodecCtx\n");

    if (NULL != sniffStreamContext->m_vDecCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffStreamContext->m_vDecCodecContext);
    }
    sniffStreamContext->m_vDecCodecContext = NULL;
    sniffStreamContext->m_vDecCodec = NULL;

    //printf("START Release acodecCtx start\n");
    if (NULL != sniffStreamContext->m_aCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffStreamContext->m_aCodecContext);
    }
    sniffStreamContext->m_aCodecContext = NULL;
    //printf("END Release acodecCtx\n");

    if (NULL != sniffStreamContext->m_decPacket && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_packet_unref(sniffStreamContext->m_decPacket);
    }
    sniffStreamContext->m_decPacket = NULL;

    //if (NULL != sniffStreamContext->m_swCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    sws_freeContext(sniffStreamContext->m_swCtx);
    //}
    //sniffStreamContext->m_swCtx = NULL;

    if (NULL != sniffStreamContext->m_naluInfo && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        if (NULL != sniffStreamContext->m_naluInfo->vps) {
            free(sniffStreamContext->m_naluInfo->vps);
            sniffStreamContext->m_naluInfo->vps     = NULL;
            sniffStreamContext->m_naluInfo->vpsLen  = 0;
        }
        if (NULL != sniffStreamContext->m_naluInfo->sps) {
            free(sniffStreamContext->m_naluInfo->sps);
            sniffStreamContext->m_naluInfo->sps     = NULL;
            sniffStreamContext->m_naluInfo->spsLen  = 0;
        }
        if (NULL != sniffStreamContext->m_naluInfo->pps) {
            free(sniffStreamContext->m_naluInfo->pps);
            sniffStreamContext->m_naluInfo->pps     = NULL;
            sniffStreamContext->m_naluInfo->ppsLen  = 0;
        }
        if (NULL != sniffStreamContext->m_naluInfo->sei) {
            free(sniffStreamContext->m_naluInfo->sei);
            sniffStreamContext->m_naluInfo->sei     = NULL;
            sniffStreamContext->m_naluInfo->seiLen  = 0;
        }
        free(sniffStreamContext->m_naluInfo);
        sniffStreamContext->m_naluInfo->naluLen = 0;
    }
    sniffStreamContext->m_naluInfo = NULL;


    //sniffStreamContext->m_sampleBuf         = NULL;
    //sniffStreamContext->m_swrCtx            = NULL;
    sniffStreamContext->m_needSwr           = 0;

    // Outside MediaInfo
    {
        sniffStreamContext->m_mediaInfo.fps = -1;
        sniffStreamContext->m_mediaInfo.gop = 0;
        sniffStreamContext->m_mediaInfo.a_duration = -1;
        sniffStreamContext->m_mediaInfo.v_duration = -1;
        sniffStreamContext->m_mediaInfo.duration = -1;

        sniffStreamContext->m_mediaInfo.a_sample_rate = 0;
        sniffStreamContext->m_mediaInfo.a_channel = 0;
        sniffStreamContext->m_mediaInfo.a_sample_fmt = NULL;
        sniffStreamContext->m_mediaInfo.a_out_sample_rate = 0;
        sniffStreamContext->m_mediaInfo.a_out_channel = 0;
        sniffStreamContext->m_mediaInfo.a_out_sample_fmt = NULL;
        sniffStreamContext->m_mediaInfo.a_profile = 2; // LC

        sniffStreamContext->m_mediaInfo.width = 0;
        sniffStreamContext->m_mediaInfo.height = 0;
    }

    sniffStreamContext->m_decLastPTS        = -1;
    sniffStreamContext->m_vTimebase         = -1;
    sniffStreamContext->m_aTimebase         = -1;
    sniffStreamContext->m_vStartTime        = -1;
    sniffStreamContext->m_aStartTime        = -1;
    sniffStreamContext->m_videoIndex        = -1;
    sniffStreamContext->m_audioIndex        = -1;
    sniffStreamContext->m_vCodec            = V_CODEC_NAME_UNKN;
    //sniffStreamContext->m_aCodec            = A_CODEC_NAME_UNKN;
    //sniffStreamContext->m_fps               = -1;
    //sniffStreamContext->m_gop               = -1;

    //sniffStreamContext->m_buf               = NULL;
    //sniffStreamContext->m_bufLen            = 0;

    sniffStreamContext->m_ignoreAudio       = 0;
    sniffStreamContext->m_defaultFps        = -1.0;
    sniffStreamContext->m_isRawStream       = 0;
    sniffStreamContext->m_frameDuration     = 0.0;
    sniffStreamContext->m_rawStreamNoFpsPts = 0.0;

    // Custom IO BD
    {
        //m_bd = {0};
        //sniffStreamContext->m_bd.resource = NULL;
        if (NULL != sniffStreamContext->m_bd.ptr && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
            free(sniffStreamContext->m_bd.ptr);
        }
        sniffStreamContext->m_bd.ptr = NULL;
        sniffStreamContext->m_bd.seek_ptr = NULL;
        sniffStreamContext->m_bd.size = 0;
        sniffStreamContext->m_bd.file_size = 0;
        sniffStreamContext->m_bd.read_pos = 0;
        sniffStreamContext->m_bd_temp_ptr = NULL;
    }

    //printf("START Release m_formatCtx\n");
    if (NULL != sniffStreamContext->m_formatCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
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
        avformat_close_input(&sniffStreamContext->m_formatCtx);
    }
    sniffStreamContext->m_formatCtx = NULL;
    //printf("END Release m_formatCtx\n");

    sniffStreamContext->m_piFmt             = NULL;
    sniffStreamContext->m_avPacket          = NULL;
    sniffStreamContext->m_pb                = NULL;

    //if (NULL != sniffStreamContext->m_videoNode && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    NLE_releaseVideoNode(&sniffStreamContext->m_videoNode);
    //}
    //sniffStreamContext->m_videoNode = NULL;

    // NALU LINK_LIST
    if (sniffStreamContext->m_avDecNaluLinkList != NULL && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        int ret_relese_nalu = AV_DEC_NaluLinkList_Release(sniffStreamContext->m_avDecNaluLinkList);
        if (ret_relese_nalu < 0) {
            printf("reset members with tag : %d, when release nalu LList get error code:%d\n", isRelease, ret_relese_nalu);
        }
    }
    sniffStreamContext->m_avDecNaluLinkList = NULL;

    // SEEK DESC
    {
        sniffStreamContext->m_seekDesc.m_seekPos = 0.0;
        sniffStreamContext->m_seekDesc.m_seekBusyPos = 0.0;
        sniffStreamContext->m_seekDesc.m_seekStatus = SEEK_STATUS_OPTION_IDLE;
    }

    //printf("START Release m_missileAvYuvFrame\n");
    //cleanAvYuvFrame(sniffStreamContext, isRelease);
    //printf("END Release m_missileAvYuvFrame\n");

    return ret;
}

int initSniffStreamFunc(SniffStreamContext *sniffStreamContext, MISSILE_SNIFFSTREAM_MODE mode) {
    if (sniffStreamContext == NULL) {
        return -1;
    }
    sniffStreamContext->introduceMineFunc();

    sniffStreamContext->m_mode = mode;

    //av_register_all();
    //avcodec_register_all();

    int ret = resetMembers(sniffStreamContext, MISSILE_CMD_IS_RELEASE_NO);
    printf("VideoMissile sniff_stream init done %d\n", ret);

    //testAPCM = fopen("test.pcm", "wb");
    //if (!testAPCM) {
    //    printf("testAPCM FAILED!");
    //    return -1;
    //}
    //testYUV = fopen("test.hevc", "wb");
    //if (!testYUV) {
    //    printf("testYUV FAILED!");
    //    return -1;
    //}

    //g_test_f_aac = fopen("./result.aac", "wb");

    // if (mode == MISSILE_SNIFFSTREAM_MODE_DECODER) {
        // else init decoder context

    sniffStreamContext->m_frame = av_frame_alloc();
    //sniffStreamContext->m_aFrame = av_frame_alloc();
    //if (!sniffStreamContext->m_frame || !sniffStreamContext->m_aFrame) {
    if (!sniffStreamContext->m_frame) {
        printf("frame alloc failed!\n");
        return -2;
    }

    sniffStreamContext->m_decPacket = av_packet_alloc();
    av_init_packet(sniffStreamContext->m_decPacket);
    if (!sniffStreamContext->m_decPacket) {
        printf("create decoder's pkg failed\n");
        return -3;
    }

    // avcodec_find_decoder(AV_CODEC_ID_HEVC)
    // @TODO 这个地方到时候直接换成codecId 上文获取的值
    sniffStreamContext->m_vDecCodec = avcodec_find_decoder(AV_CODEC_ID_HEVC);
    //sniffStreamContext->m_vDecCodec = avcodec_find_decoder(AV_CODEC_ID_H264);
    sniffStreamContext->m_vDecCodecContext = avcodec_alloc_context3(sniffStreamContext->m_vDecCodec);
    if (avcodec_open2(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_vDecCodec, NULL) < 0) {
        printf("init open video single decoder failed\n");
        return -4;
    }

    sniffStreamContext->m_vDecCodecContext->thread_count = MISSILE_DEC_THREAD_COUNT;
    sniffStreamContext->m_vDecCodecContext->thread_type = FF_THREAD_FRAME;
    sniffStreamContext->m_vDecCodecContext->flags |= AV_CODEC_FLAG_TRUNCATED;
    // } // init decoder

    sniffStreamContext->m_avDecNaluLinkList = AV_DEC_NaluLinkList_Create_By_Idx(0);
    if (sniffStreamContext->m_avDecNaluLinkList == NULL) {
        printf("init open video nalu LList failed\n");
        return -5;
    }

    return ret;
} // initSniffStreamFunc

int releaseSniffStreamFunc(SniffStreamContext *sniffStreamContext) {
    IS_INTRODUCE_MINE = 0;
    sniffStreamContext->m_threadRefresh = 1;
    int ret = resetMembers(sniffStreamContext, MISSILE_CMD_IS_RELEASE_YES);
    printf("VideoMissile sniff_stream release done %d\n", ret);
    return ret;
} // releaseSniffStreamFunc

//int find_sample_index(int samplerate)
//{
//    int adts_sample_rates[] = {96000,882000,64000,48000,44100,32000,24000,22050,16000,12000,11025,8000,7350,0,0,0};
//    int i;
//    for(i=0; i < 16;i++)
//    {
//        if(samplerate == adts_sample_rates[i])
//            return i;
//    }
//    return 16 - 1;
//}


/**
 * Decode
 * @param vcodecer
 * @param buff
 * @param in_len
 * @param pts (MS)
 * @return
 */
int decodeVideoFrameFunc(
        SniffStreamContext *sniffStreamContext, uint8_t *buff, int len,
        long pts, long dts, int tag, int skip)
{
    if (sniffStreamContext == NULL) {
        printf("decode frame prepare failed: core ptr is NULL\n");
        return -1;
    }

    if (buff == NULL || len <= 0) {
        printf("decode frame prepare failed: buff is NULL\n");
        return -2;
    }
#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)

    int ret_len = AV_DEC_NaluNode_Append(sniffStreamContext->m_avDecNaluLinkList,
            buff, len, pts, dts, tag, skip);
    if (ret_len < 0) {
        printf("decode frame prepare failed: append nalu LList failed! error code:%d\n", ret_len);
        return ret_len;
    }

    // @TODO DEBUG
    // printf("nalu LList length 1:%d\n", ret_len);

    return ret_len;
#endif
    double pts_d = (double) pts / 1000.0;
    // split action check
    //if (NULL != sniffStreamContext->m_videoNode &&
    //    sniffStreamContext->m_videoNode->m_splitEnd > 0 &&
    //    sniffStreamContext->m_videoNode->m_splitDur > 0)
    //{
    //    printf("DEBUG Split end is :%f, now pts is %f\n", sniffStreamContext->m_videoNode->m_splitEnd, pts_d);
    //    if (pts_d > sniffStreamContext->m_videoNode->m_splitEnd) {
    //        printf("Split CHECK SUCC: split %f>%f", pts_d, sniffStreamContext->m_videoNode->m_splitEnd);
    //        return MISSILE_PKT_GET_SPLIT_FINISHED;
    //    }
    //}

    // printf("debug +++ decodeVideoFrameFunc len:%d pts:%ld dts:%ld\n", len, pts, dts);

    sniffStreamContext->m_decPacket->data = buff;
    sniffStreamContext->m_decPacket->size = len;
    sniffStreamContext->m_decPacket->pts = pts;
    sniffStreamContext->m_decPacket->dts = dts;
    sniffStreamContext->m_decPacket->tag = tag;
    sniffStreamContext->m_decPacket->skip = skip;

    char szError[256] = {0};

    //int frameFinished = -1;
    //int rec_re = avcodec_decode_video2(
    //        sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_frame,
    //        &frameFinished, sniffStreamContext->m_decPacket);

    // int sendRet = avcodec_send_packet(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_decPacket);
    int sendRet = avcodec_send_packet(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_decPacket);

    if (sendRet == AVERROR(EAGAIN)) {
        printf("sendRet ===========> EAGAIN\n");

        av_strerror(sendRet, szError, 256);
        printf("[x] Decode Failed! pts:%ld dts:%ld step0.0 : %d, %s\n", pts, dts, sendRet, szError);
        return MISSILE_PKT_GET_NOTHING;
    } else if (sendRet == AVERROR_EOF) {
        printf("sendRet ===========> AVERROR_EOF\n");

        av_strerror(sendRet, szError, 256);
        printf("[x] Decode Failed! pts:%ld dts:%ld step0.0 : %d, %s\n", pts, dts, sendRet, szError);
        return MISSILE_PKT_GET_NOTHING;
    } else if (sendRet == AVERROR(EINVAL)) {
        printf("sendRet ===========> EINVAL\n");

        av_strerror(sendRet, szError, 256);
        printf("[x] Decode Failed! pts:%ld dts:%ld step0.0 : %d, %s\n", pts, dts, sendRet, szError);
        return MISSILE_PKT_GET_NOTHING;
    } else if (sendRet == AVERROR(ENOMEM)) {
        printf("sendRet ===========> ENOMEM\n");

        av_strerror(sendRet, szError, 256);
        printf("[x] Decode Failed! pts:%ld dts:%ld step0.0 : %d, %s\n", pts, dts, sendRet, szError);
        return MISSILE_PKT_GET_NOTHING;
    } else {
        // printf("sendRet ===========> %d\n", sendRet);
    }

    int hasYuv = 0;
    if (sendRet == 0) {
        int rec_re = 0;
        while(1) {
            rec_re = avcodec_receive_frame(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_frame);
            if (rec_re == 0) {

                // debug
                /*
                //if (debug_c <= 0) {
                //    FILE *g_test_f_yuv = fopen("./result_yuv420p10le.yuv", "wb");
                //    int sizedebug = sniffStreamContext->m_frame->width * 1920 * 3;
                //    printf("===============> DEBUG %s linesize:%d %d %d wh:%d %d\n",
                //            av_get_pix_fmt_name(sniffStreamContext->m_vDecCodecContext->pix_fmt),
                //            sniffStreamContext->m_frame->linesize[0],
                //            sniffStreamContext->m_frame->linesize[1],
                //            sniffStreamContext->m_frame->linesize[2],
                //            sniffStreamContext->m_frame->width, sniffStreamContext->m_frame->height);
                //    fwrite(sniffStreamContext->m_frame->data, 1,
                //           sizedebug,
                //            g_test_f_yuv);
                //    fclose(g_test_f_yuv);
                //    debug_c += 1;
                //}
                 */

                if (skip > 0) {
                    // skip
                    sniffStreamContext->m_seekDesc.m_seekBusyPos = pts_d;

                } else {
                    /*
                    if (sniffStreamContext->m_swCtx == NULL) {
                        sniffStreamContext->m_swCtx = sws_getContext(
                                sniffStreamContext->m_mediaInfo.width, sniffStreamContext->m_mediaInfo.height,
                                sniffStreamContext->m_vDecCodecContext->pix_fmt, // in ,vcodec->frame->format
                                sniffStreamContext->m_mediaInfo.width, sniffStreamContext->m_mediaInfo.height,
                                AV_PIX_FMT_RGBA, // out AV_PIX_FMT_RGB24
                                SWS_FAST_BILINEAR, NULL, NULL, NULL); // liner algorithm SWS_BICUBIC
                    }
                    if (sniffStreamContext->m_outFrame == NULL) {
                        sniffStreamContext->m_outFrame = av_frame_alloc();
                        if (!sniffStreamContext->m_outFrame) {
                            printf("av_frame_alloc-out frame 初始化失败\n");
                            return -1;
                        }
                    }

                    // Frames
                    uint8_t *out_buffer = NULL;
                    int wh_size = sniffStreamContext->m_frame->width * sniffStreamContext->m_frame->height;

                    sniffStreamContext->m_outFrame->width = sniffStreamContext->m_frame->width;
                    sniffStreamContext->m_outFrame->height = sniffStreamContext->m_frame->height;
                    sniffStreamContext->m_outFrame->format =  AV_PIX_FMT_RGBA; // out AV_PIX_FMT_RGB24

                    out_buffer = (uint8_t *) av_malloc((int) (wh_size * 4.0) * sizeof(uint8_t));
                    avpicture_fill(
                            (AVPicture *) sniffStreamContext->m_outFrame, out_buffer,
                            AV_PIX_FMT_RGBA,
                            sniffStreamContext->m_outFrame->width, sniffStreamContext->m_outFrame->height);

                    sws_scale(sniffStreamContext->m_swCtx,
                              (const uint8_t *const *) sniffStreamContext->m_frame->data,
                              sniffStreamContext->m_frame->linesize, // (const uint8_t* const*)
                              0, sniffStreamContext->m_frame->height,
                              sniffStreamContext->m_outFrame->data,
                              sniffStreamContext->m_outFrame->linesize);
                    */

                    // printf("debug +++++ receive frame pts:%lld\n", sniffStreamContext->m_frame->pts);
                    if (sniffStreamContext->isSetCallback > 0) {
                        //printf("debug %d %d %d\n",
                        //       sniffStreamContext->m_frame->linesize[0],
                        //       sniffStreamContext->m_frame->linesize[1],
                        //       sniffStreamContext->m_frame->linesize[2]);
                        sniffStreamContext->yuvFrameCallback(sniffStreamContext->m_frame->data[0],
                                                             sniffStreamContext->m_frame->data[1],
                                                             sniffStreamContext->m_frame->data[2],
                                                             sniffStreamContext->m_frame->linesize[0],
                                                             sniffStreamContext->m_frame->linesize[1],
                                                             sniffStreamContext->m_frame->linesize[2],
                                                             sniffStreamContext->m_mediaInfo.width,
                                                             sniffStreamContext->m_mediaInfo.height,
                                                             (double) sniffStreamContext->m_frame->pts / 1000.0,
                                                             tag);

                        //sniffStreamContext->rgb24FrameCallback(sniffStreamContext->m_outFrame->data[0],
                        //                                       sniffStreamContext->m_outFrame->linesize[0],
                        //                                       sniffStreamContext->m_mediaInfo.width,
                        //                                       sniffStreamContext->m_mediaInfo.height,
                        //        //(double) sniffStreamContext->m_frame->pts / 1000.0,
                        //                                       pts_d,
                        //                                       tag);
                        hasYuv += 1;
                    } // ok

                    //av_free(out_buffer);
                    //out_buffer = NULL;

                } // Decode callback
            } else {
                if (hasYuv <= 0) {
                    av_strerror(rec_re, szError, 256);
                    printf("[x] Decode Failed! pts:%ld dts:%ld step1.0 : %d, %s\n", pts, dts, rec_re, szError);
                }
                break;
            } // end rec_re === 0
        }

        av_packet_unref(sniffStreamContext->m_decPacket);

        if (hasYuv > 0) {
            return MISSILE_PKT_GET_TYPE_YUV;
        }
    } else {
        return MISSILE_PKT_GET_NOTHING;
    }
    /*
    //if (rec_re < 0) {
    //    //av_free_packet(vcodecer->avPacket);
    //    av_strerror(rec_re, szError, 256);
    //    printf("[x] Decode Failed! 0.1 : %d, %s\n", rec_re, szError);
    //    return rec_re;
    //}
    //
    //if (frameFinished && sniffStreamContext->isSetCallback > 0) {
    //    sniffStreamContext->yuvFrameCallback(sniffStreamContext->m_frame->data[0],
    //                                         sniffStreamContext->m_frame->data[1],
    //                                         sniffStreamContext->m_frame->data[2],
    //                                         sniffStreamContext->m_frame->linesize[0],
    //                                         sniffStreamContext->m_frame->linesize[1],
    //                                         sniffStreamContext->m_frame->linesize[2],
    //                                         sniffStreamContext->m_mediaInfo.width,
    //                                         sniffStreamContext->m_mediaInfo.height,
    //                                         (double) sniffStreamContext->m_frame->pts / 1000.0);
    //    return MISSILE_PKT_GET_TYPE_YUV;
    //} // ok

    //if (NULL != sniffStreamContext->m_pktNodeHead) {
    //    if (sniffStreamContext->m_pktNodePlayPtr == NULL) {
    //        sniffStreamContext->m_pktNodePlayPtr = sniffStreamContext->m_pktNodeHead;
    //    }
    //
    //    sniffStreamContext->m_pktNodePlayPtr = sniffStreamContext->m_pktNodePlayPtr;
    //
    //    AVPacket *pkt = sniffStreamContext->m_pktNodePlayPtr->avPacket;
    //
    //    // do
    //    int frameFinished = 0;
    //    // 解码
    //    int recvRet = avcodec_decode_video2(
    //            sniffStreamContext->m_vCodecContext, sniffStreamContext->m_frame, &frameFinished, pkt);
    //    //int recvRet = avcodec_receive_frame(sniffStreamContext->m_vCodecContext, sniffStreamContext->m_frame);
    //    //printf("recvRet ===========> %d\n", recvRet);
    //
    //    //double vTime = pkt->pts * sniffStreamContext->m_vTimebase;
    //
    //    if (frameFinished && sniffStreamContext->isSetCallback > 0) {
    //    //if (recvRet >= 0 && sniffStreamContext->isSetCallback > 0) {
    //        sniffStreamContext->yuvFrameCallback(sniffStreamContext->m_frame->data[0],
    //                                             sniffStreamContext->m_frame->data[1],
    //                                             sniffStreamContext->m_frame->data[2],
    //                                             sniffStreamContext->m_frame->linesize[0],
    //                                             sniffStreamContext->m_frame->linesize[1],
    //                                             sniffStreamContext->m_frame->linesize[2],
    //                                             sniffStreamContext->m_mediaInfo.width,
    //                                             sniffStreamContext->m_mediaInfo.height,
    //                                             sniffStreamContext->m_frame->pts * sniffStreamContext->m_vTimebase);
    //    } // ok
    //
    //    // next frame
    //    sniffStreamContext->m_pktNodePlayPtr = sniffStreamContext->m_pktNodePlayPtr->next;
    //    return MISSILE_PKT_GET_TYPE_YUV;
    //}
    */

    return MISSILE_PKT_GET_NOTHING;
}

/**
 * Decoder
 * @param sniffStreamContext
 * @param checkProbe 0 NO 1 YES
 * @param skip 0 NO 1 YES(no callback)
 * @return
 */
int getSniffStreamPacketFunc(SniffStreamContext *sniffStreamContext, int checkProbe, int skip) {
    if (sniffStreamContext->m_formatCtx == NULL) {
        printf("read pkg vod error: format context param null\n");
        return -2;
    }

    if (sniffStreamContext->m_avPacket == NULL) {
        printf("read pkg vod error: pkg param null\n");
        return -3;
    }

    if (checkProbe > 0 && sniffStreamContext->m_probe < 1) {
        printf("read pkg vod error: probe param null: %d\n", sniffStreamContext->m_probe);
        return -4;
    }

    //printf("debug start getSniffStreamPacketFunc\n");

    int ret_rframe = av_read_frame(sniffStreamContext->m_formatCtx, sniffStreamContext->m_avPacket);
    if (ret_rframe < 0) {
        // printf("read pkg vod error: %d, %d, %s\n", ret_rframe, AVERROR_EOF, getCodeMsg(ret_rframe));

        if (ret_rframe == AVERROR_EOF) {
            //fclose(g_test_f_aac);
            //g_test_f_aac = NULL;
            return DECODE_EOF_CODE;
        }
        return -1;
    }

    //printf("debug start getSniffStreamPacketFunc 2\n");

    int ret = 0;

    if (sniffStreamContext->m_avPacket->stream_index == sniffStreamContext->m_videoIndex) {
        //printf("Get Video!\n");

        //printf("debug start getSniffStreamPacketFunc 3\n");

        if (sniffStreamContext->m_vStartTime < 0) {
            sniffStreamContext->m_vStartTime =
                    (sniffStreamContext->m_avPacket->dts < sniffStreamContext->m_avPacket->pts) ?
                    sniffStreamContext->m_avPacket->dts : sniffStreamContext->m_avPacket->pts;
            //printf("debug m_vStartTime %f\n", sniffStreamContext->m_vStartTime * sniffStreamContext->m_vTimebase);
        }

        sniffStreamContext->m_avPacket->dts -= sniffStreamContext->m_vStartTime;
        sniffStreamContext->m_avPacket->pts -= sniffStreamContext->m_vStartTime;

        //printf("debug start getSniffStreamPacketFunc 4\n");

        //memcpy(sniffStreamContext->m_avPacket->data, START_CODE, 4);
        //for (int i = 0; i < sniffStreamContext->m_avPacket->size; ++i) {
        //    printf("%d ", sniffStreamContext->m_avPacket->data[i]);
        //}
        //printf("\n");

        //int sendRet = avcodec_send_packet(sniffStreamContext->m_vCodecContext, sniffStreamContext->m_avPacket);
        //if (sendRet == AVERROR(EAGAIN)) {
        //    printf("sendRet ===========> EAGAIN\n");
        //} else if (sendRet == AVERROR_EOF) {
        //    printf("sendRet ===========> AVERROR_EOF\n");
        //} else if (sendRet == AVERROR(EINVAL)) {
        //    printf("sendRet ===========> EINVAL\n");
        //} else if (sendRet == AVERROR(ENOMEM)) {
        //    printf("sendRet ===========> ENOMEM\n");
        //} else {
        //    printf("sendRet ===========> %d\n", sendRet);
        //}

        // 解码过滤器
        //AVBitStreamFilter *absFilter = NULL;
        //AVBSFContext *absCtx = NULL;
        //absFilter = av_bsf_get_by_name("hevc_mp4toannexb");
        ////过滤器分配内存
        //av_bsf_alloc(absFilter, &absCtx);
        //avcodec_parameters_copy(
        //        absCtx->par_in, sniffStreamContext->m_formatCtx->streams[sniffStreamContext->m_videoIndex]->codecpar);
        //av_bsf_init(absCtx);

        //printf("before av_bsf_receive_packet : p:%f d:%f\n",
        //       sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_vTimebase,
        //       sniffStreamContext->m_avPacket->dts * sniffStreamContext->m_vTimebase);

        if (av_bsf_send_packet(sniffStreamContext->m_absCtx, sniffStreamContext->m_avPacket) != 0) {
            return -1;
        }

        //printf("debug start getSniffStreamPacketFunc 5: %d %d\n",
        //        sniffStreamContext->m_absCtx == NULL, sniffStreamContext->m_avPacket == NULL);

        while (av_bsf_receive_packet(sniffStreamContext->m_absCtx, sniffStreamContext->m_avPacket) == 0) {
            //printf("av_bsf_receive_packet : p:%f d:%f\n",
            //        sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_vTimebase,
            //        sniffStreamContext->m_avPacket->dts * sniffStreamContext->m_vTimebase);

            // nalu header 暂时不用
            /*
            if (NULL == sniffStreamContext->m_naluInfo
                || sniffStreamContext->m_naluInfo->naluLen == 0) {


                if (NULL == sniffStreamContext->m_naluInfo) {
                    sniffStreamContext->m_naluInfo = (NaluInfo *) malloc(sizeof(NaluInfo));

                    sniffStreamContext->m_naluInfo->vps = NULL;
                    sniffStreamContext->m_naluInfo->vpsLen = 0;

                    sniffStreamContext->m_naluInfo->sps = NULL;
                    sniffStreamContext->m_naluInfo->spsLen = 0;

                    sniffStreamContext->m_naluInfo->pps = NULL;
                    sniffStreamContext->m_naluInfo->ppsLen = 0;

                    sniffStreamContext->m_naluInfo->sei = NULL;
                    sniffStreamContext->m_naluInfo->seiLen = 0;

                    sniffStreamContext->m_naluInfo->naluLen = 0;
                }
                //AVBitStreamFilterContext* bsfc =  av_bsf_get_by_name("hevc_mp4toannexb");
                if (sniffStreamContext->m_vCodecContext->extradata[0] == 1) {

                    const uint8_t *pExtra = sniffStreamContext->m_vCodecContext->extradata;
                    int extIdx = 23;
                    int extSize = sniffStreamContext->m_vCodecContext->extradata_size;

                    for (int tmpIdx = 0; tmpIdx < sniffStreamContext->m_vCodecContext->extradata_size; ++tmpIdx) {
                        printf("%2x ", sniffStreamContext->m_vCodecContext->extradata[tmpIdx]);
                        if ((tmpIdx + 1) % 16 == 0) {
                            printf("\n");
                        }
                    }
                    printf("\n <===== \n");
                    // @TODO 针对haokan站这种 自定义extradata HvcC头的也需要兼容

    // 1  1 60  0  0  0 90  0  0  0  0  0 78 f0  0 fc
    //fd f8 f8  0  0  f  4 a0  0  1  0 19 40  1  c  1
    //ff ff  1 60  0  0  3  0 90  0  0  3  0  0  3  0
    //78 9c a1 10 24 a1  0  1  0 29 42  1  1  1 60  0
    // 0  3  0 90  0  0  3  0  0  3  0 78 a0  2 80 80
    //2d 16 59 ca 11 92 45 2b 80 40  0  0  3  0 40  0
    // 0  6 42 a2  0  1  0  8 44  1 c1 72 b4 70 84 24
    //27  0  1  1 34 4e  1  5 ff 2f 2c a2 de  9 b5 17
    //47 db bb 55 a4 fe 7f c2 fc 4e 62 64 2d 32 36 35
    //5f 32 2d 30 2d 33 2d 31 5f 50 44 5f 42 4c 20 5b
    //4c 69 6e 75 78 5d 5b 47 43 43 20 34 2e 38 2e 32
    //5d 5b 36 34 20 62 69 74 5d 20 38 62 69 74 20 2d
    //20 48 2e 32 36 35 2f 48 45 56 43 20 63 6f 64 65
    //63 20 2d 20 43 6f 70 79 72 69 67 68 74 20 32 30
    //31 39 2d 32 30 32 30 20 28 63 29 20 42 61 69 64
    //75 2c 20 49 6e 63 20 2d 20 68 74 74 70 3a 2f 2f
    //77 77 77 2e 62 61 69 64 75 2e 63 6f 6d 20 2d 20
    //6f 70 74 69 6f 6e 73 3a 20 63 70 75 69 64 3d 31
    //31 31 31 30 33 39 20 70 72 65 73 65 74 3d 35 20
    //62 69 74 64 65 70 74 68 3d 38 20 69 6e 70 75 74
    //2d 63 73 70 3d 31 20 66 70 73 3d 32 35 2f 31 20
    //69 6e 70 75 74 2d 72 65 73 3d 31 32 38 30 78 37
    //32 30 20 72 63 3d 63 72 66 20 63 72 66 3d 32 37
    //2e 30 20 76 62 76 2d 6d 61 78 72 61 74 65 3d 32
    //35 30 30 20 76 62 76 2d 62 75 66 73 69 7a 65 3d
    //33 37 35 30 20 76 62 76 2d 69 6e 69 74 3d 30 2e
    //39 20 6e 6f 2d 68 64 72 80

                    for (; extIdx < extSize;) {

                        uint8_t checkCode1 = pExtra[extIdx + 0]; // no24

                        uint8_t checkSize1_part1 = pExtra[extIdx + 1];
                        uint8_t checkSize1_part2 = pExtra[extIdx + 2];
                        uint16_t checkSize1 = (checkSize1_part1 << 8) + checkSize1_part2;

                        uint8_t checkSize2_part1 = pExtra[extIdx + 3];
                        uint8_t checkSize2_part2 = pExtra[extIdx + 4];
                        uint16_t checkSize2 = (checkSize2_part1 << 8) + checkSize2_part2;

                        int naluPartSize = checkSize2 + 4;

                        printf("write check %d idx:%d extSize:%d, checkSize1:%d checkSize2:%d, naluPartSize:%d\n",
                               checkCode1, extIdx, extSize, checkSize1, checkSize2, naluPartSize);

                        extIdx += 5;

                        //if (checkCode1 == 0x20 && NULL == sniffStreamContext->m_naluInfo->vps) { // 32 vps
                        if (NULL == sniffStreamContext->m_naluInfo->vps) { // 32 vps
                            //fwrite(startcode, 1, 4, testYUV);
                            //fwrite(pExtra + extIdx, 1, checkSize2, testYUV);
                            printf("write VPS %d %d\n", checkCode1, checkSize2);

                            sniffStreamContext->m_naluInfo->vps = (uint8_t *) malloc(sizeof(uint8_t) * naluPartSize);
                            sniffStreamContext->m_naluInfo->vpsLen = naluPartSize;
                            sniffStreamContext->m_naluInfo->naluLen += naluPartSize;

                            memcpy(sniffStreamContext->m_naluInfo->vps, STARTCODE, 4);
                            memcpy(sniffStreamContext->m_naluInfo->vps + 4, pExtra + extIdx, checkSize2);

                            //} else if (checkCode1 == 0x21 && NULL == sniffStreamContext->m_naluInfo->sps) { // sps
                        } else if (NULL == sniffStreamContext->m_naluInfo->sps) { // sps
                            //fwrite(startcode, 1, 4, testYUV);
                            //fwrite(pExtra + extIdx, 1, checkSize2, testYUV);
                            printf("write SPS %d %d\n", checkCode1, checkSize2);

                            sniffStreamContext->m_naluInfo->sps = (uint8_t *) malloc(sizeof(uint8_t) * naluPartSize);
                            sniffStreamContext->m_naluInfo->spsLen = naluPartSize;
                            sniffStreamContext->m_naluInfo->naluLen += naluPartSize;

                            memcpy(sniffStreamContext->m_naluInfo->sps, STARTCODE, 4);
                            memcpy(sniffStreamContext->m_naluInfo->sps + 4, pExtra + extIdx, checkSize2);

                            //} else if (checkCode1 == 0x22 && NULL == sniffStreamContext->m_naluInfo->pps) { // pps
                        } else if (NULL == sniffStreamContext->m_naluInfo->pps) { // pps
                            //fwrite(startcode, 1, 4, testYUV);
                            //fwrite(pExtra + extIdx, 1, checkSize2, testYUV);
                            printf("write PPS %d %d\n", checkCode1, checkSize2);

                            sniffStreamContext->m_naluInfo->pps = (uint8_t *) malloc(sizeof(uint8_t) * naluPartSize);
                            sniffStreamContext->m_naluInfo->ppsLen = naluPartSize;
                            sniffStreamContext->m_naluInfo->naluLen += naluPartSize;

                            memcpy(sniffStreamContext->m_naluInfo->pps, STARTCODE, 4);
                            memcpy(sniffStreamContext->m_naluInfo->pps + 4, pExtra + extIdx, checkSize2);

                            //} else if ((checkCode1 == 39 || checkCode1 == 40)
                            //&& NULL == sniffStreamContext->m_naluInfo->sei) { // HEVC_NAL_SEI_PREFIX
                        } else if (NULL == sniffStreamContext->m_naluInfo->sei) { // HEVC_NAL_SEI_PREFIX

                            //fwrite(startcode, 1, 4, testYUV);
                            //fwrite(pExtra + extIdx, 1, checkSize2, testYUV);
                            printf("write SEI %d %d\n", checkCode1, checkSize2);

                            sniffStreamContext->m_naluInfo->sei = (uint8_t *) malloc(sizeof(uint8_t) * naluPartSize);
                            sniffStreamContext->m_naluInfo->seiLen = naluPartSize;
                            sniffStreamContext->m_naluInfo->naluLen += naluPartSize;

                            memcpy(sniffStreamContext->m_naluInfo->sei, STARTCODE, 4);
                            memcpy(sniffStreamContext->m_naluInfo->sei + 4, pExtra + extIdx, checkSize2);
                        }

                        extIdx += (checkSize2);
                    }

                    //if (sniffStreamContext->m_avPacket->flags == AV_PKT_FLAG_KEY) {
                    //    fwrite(startcode, 1, 4, testYUV);
                    //    fwrite(sniffStreamContext->m_vCodecContext->extradata, 1,
                    //           sniffStreamContext->m_vCodecContext->extradata_size, testYUV);
                    //}
                }
                //fwrite(startcode, 1, 4, testYUV);
                //fwrite(sniffStreamContext->m_avPacket->data + 4, 1, sniffStreamContext->m_avPacket->size - 4, testYUV);
            }
            */

            //printf("debug start getSniffStreamPacketFunc 5.1\n");

            uint8_t *naluFrame = NULL;
            int frameLen = 0;
            int appendIdx = 0;

            // 暂时不用替换，用bsf解决了
            // 针对B站这种自带SPS PPS头数据的 做下兼容
            // 这种case属于 mdat也自带NALU header信息，长度相同，但是mdat里面对于start code没有做替换，所以需要替换一下
            /*
             0000000140010c01ffff01600000030090000003000003007898b02400000001420101016000000300900000030000030078a00280802d16598b924cae6a04020c08000003000800000300f040000000014401c0373c1890000000014e010568d3ec26e3ac2d54bf9cdac6f0a5e4359a205948455643456e63286275696c642059484556432e312e31352e3129202d20482e3236352f4845564320636f646563202d20436f7079726967687420323031382d32303230202863292042696c6962696c6920496e6300800000000140010c01ffff01600000030090000003000003007898b02400000001420101016000000300900000030000030078a00280802d16598b924cae6a04020c08000003000800000300f040000000014401c0373c1890000000014e010568d3ec26e3ac2d54bf9cdac6f0a5e4359a205948455643456e63286275696c642059484556432e312e31352e3129202d20482e3236352f4845564320636f646563202d20436f7079726967687420323031382d32303230202863292042696c6962696c6920496e630080

    00000001
    2601af0a460d8b4cf16280dd06a9bfae87d484b4760c6d5bab3f69fe1a8d38ac2fd09d246caad11f2895a4dbb7c900504196f81380df764da11765ce7a6c4679f18d0e8a0d2d83df0e95fd7c380d106780db2302920db9059fae2565ec45aa2ff7d592c03b35611414ae
             */
            /*
            if (sniffStreamContext->m_avPacket->flags == AV_PKT_FLAG_KEY && NULL != sniffStreamContext->m_naluInfo) {
                printf("start write nalu frame\n");
                frameLen = sniffStreamContext->m_avPacket->size + sniffStreamContext->m_naluInfo->naluLen;
                naluFrame = (uint8_t *) malloc(sizeof(uint8_t) * frameLen);

                printf("start write nalu frame 1.1 %llu\n", sniffStreamContext->m_naluInfo->vpsLen);

                if (NULL != sniffStreamContext->m_naluInfo->vps) {
                    memcpy(naluFrame + appendIdx, sniffStreamContext->m_naluInfo->vps,
                           sniffStreamContext->m_naluInfo->vpsLen);
                    appendIdx += sniffStreamContext->m_naluInfo->vpsLen;
                }
                printf("start write nalu frame 1.2\n");

                if (NULL != sniffStreamContext->m_naluInfo->sps) {
                    memcpy(naluFrame + appendIdx, sniffStreamContext->m_naluInfo->sps,
                           sniffStreamContext->m_naluInfo->spsLen);
                    appendIdx += sniffStreamContext->m_naluInfo->spsLen;
                }
                printf("start write nalu frame 1.3\n");

                if (NULL != sniffStreamContext->m_naluInfo->pps) {
                    memcpy(naluFrame + appendIdx, sniffStreamContext->m_naluInfo->pps,
                           sniffStreamContext->m_naluInfo->ppsLen);
                    appendIdx += sniffStreamContext->m_naluInfo->ppsLen;
                }
                printf("start write nalu frame 1.4\n");

                if (NULL != sniffStreamContext->m_naluInfo->sei) {
                    memcpy(naluFrame + appendIdx, sniffStreamContext->m_naluInfo->sei,
                           sniffStreamContext->m_naluInfo->seiLen);
                    appendIdx += sniffStreamContext->m_naluInfo->seiLen;
                }

                printf("start write nalu frame 2\n");

                memcpy(naluFrame + appendIdx, STARTCODE, 4);
                appendIdx += 4;

                memcpy(naluFrame + appendIdx,
                       sniffStreamContext->m_avPacket->data + 4 + sniffStreamContext->m_naluInfo->naluLen,
                       sniffStreamContext->m_avPacket->size - 4 - sniffStreamContext->m_naluInfo->naluLen);
                //memcpy(naluFrame + appendIdx,
                //        sniffStreamContext->m_avPacket->data + 4,
                //        sniffStreamContext->m_avPacket->size - 4);

                //fwrite(STARTCODE, 1, 4, testYUV);
                //fwrite(sniffStreamContext->m_avPacket->data + 4, 1,
                //        sniffStreamContext->m_avPacket->size - 4, testYUV);
            } else {
                frameLen = sniffStreamContext->m_avPacket->size;
                naluFrame = (uint8_t *) malloc(sizeof(uint8_t) * frameLen);

                memcpy(naluFrame + appendIdx, STARTCODE, 4);
                appendIdx += 4;

                memcpy(naluFrame + appendIdx, sniffStreamContext->m_avPacket->data + 4,
                       sniffStreamContext->m_avPacket->size - 4);
            }
             */
            frameLen = sniffStreamContext->m_avPacket->size;
            naluFrame = (uint8_t *) malloc(sizeof(uint8_t) * frameLen);

            //printf("debug start getSniffStreamPacketFunc 5.2\n");

            memcpy(naluFrame + appendIdx, STARTCODE, 4);
            appendIdx += 4;

            memcpy(naluFrame + appendIdx, sniffStreamContext->m_avPacket->data + 4,
                   sniffStreamContext->m_avPacket->size - 4);

            //printf("debug start getSniffStreamPacketFunc 5.3\n");

            //printf(" write dts : %f pts: %f\n",
            //       sniffStreamContext->m_avPacket->dts * sniffStreamContext->m_vTimebase,
            //       sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_vTimebase);

            double v_pts = sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_vTimebase;
            double v_dts = sniffStreamContext->m_avPacket->dts * sniffStreamContext->m_vTimebase;
            sniffStreamContext->m_decLastPTS = pts_fixed_2(MAX(sniffStreamContext->m_decLastPTS, v_pts));

            if (sniffStreamContext->isSetCallback > 0) {

                if (skip > 0) {
                    decodeVideoFrameFunc(
                            sniffStreamContext, naluFrame, frameLen,
                            (long) (v_pts * 1000.0), (long) (v_dts * 1000.0), 0, skip);
                } else {
                    if (sniffStreamContext->m_isRawStream == 1) {
                        v_pts = sniffStreamContext->m_rawStreamNoFpsPts;
                        v_dts = sniffStreamContext->m_rawStreamNoFpsPts;
                        sniffStreamContext->m_rawStreamNoFpsPts += sniffStreamContext->m_frameDuration;
                    }
                    // EM_ASM_(
                    //     {
                    //         postMessage(
                    //             {
                    //                 cmd:"go",
                    //                 data: {
                    //                     type: "video",
                    //                     corePtr: $0,
                    //                     naluFrame: $1,
                    //                     frameLen: $2,
                    //                     isKey: $3,
                    //                     width: $4,
                    //                     height: $5,
                    //                     v_pts: $6,
                    //                     v_dts: $7,
                    //                     isRaw: $8
                    //                 }
                    //             }
                    //         );
                    //     },
                    //     sniffStreamContext,
                    //     naluFrame,
                    //     frameLen,
                    //     sniffStreamContext->m_avPacket->flags == AV_PKT_FLAG_KEY,
                    //     sniffStreamContext->m_mediaInfo.width,
                    //     sniffStreamContext->m_mediaInfo.height,
                    //     v_pts,
                    //     v_dts,
                    //     sniffStreamContext->m_isRawStream
                    // );
                    sniffStreamContext->naluFrameCallback(
                            naluFrame, frameLen, sniffStreamContext->m_avPacket->flags == AV_PKT_FLAG_KEY,
                            sniffStreamContext->m_mediaInfo.width, sniffStreamContext->m_mediaInfo.height,
                            v_pts,
                            v_dts,
                            sniffStreamContext->m_isRawStream);
                }
            }

            //printf("debug start getSniffStreamPacketFunc 5.4\n");

            if (NULL != naluFrame) {
                free(naluFrame);
                naluFrame = NULL;
                frameLen = 0;
                appendIdx = 0;
            }

            //printf("debug start getSniffStreamPacketFunc 5.5\n");
        }

        //printf("debug start getSniffStreamPacketFunc 6\n");

        // @TODO 性能问题，分离音视频流，寻找算法将音频可以独立抽离
        //AVPacket *newPkt = (AVPacket *)malloc(sizeof(struct AVPacket));
        //av_init_packet(newPkt);
        //av_packet_ref(newPkt, sniffStreamContext->m_avPacket);
        //av_copy_packet(newPkt, sniffStreamContext->m_avPacket);

        //if (sniffStreamContext->m_pktNodeHead == NULL) {
        //    sniffStreamContext->m_pktNodeHead = (AVPktNode *)malloc(sizeof(AVPktNode));
        //    sniffStreamContext->m_pktNodeHead->avPacket = newPkt;
        //    sniffStreamContext->m_pktNodeHead->next = NULL;
        //
        //    sniffStreamContext->m_pktNodePtr = sniffStreamContext->m_pktNodeHead;
        //} else {
        //    //if (NULL != sniffStreamContext->m_pktNodeHead) {
        //    //    sniffStreamContext->m_pktNodePtr = sniffStreamContext->m_pktNodeHead;
        //    //
        //    //    while (NULL != sniffStreamContext->m_pktNodePtr->next) {
        //    //        sniffStreamContext->m_pktNodePtr = sniffStreamContext->m_pktNodePtr->next;
        //    //    }
        //    //}
        //
        //    /**
        //     * @TODO 这里需要修复一个问题：PTS重复出现的问题
        //     */
        //    sniffStreamContext->m_pktNodePtr->next = (AVPktNode *)malloc(sizeof(AVPktNode));
        //    sniffStreamContext->m_pktNodePtr = sniffStreamContext->m_pktNodePtr->next;
        //    sniffStreamContext->m_pktNodePtr->avPacket = newPkt;
        //    sniffStreamContext->m_pktNodePtr->next = NULL;
        //}
        ret = MISSILE_PKT_GET_TYPE_HAVE_VIDEO;

    } else if (sniffStreamContext->m_ignoreAudio == 0
               && sniffStreamContext->m_avPacket->stream_index == sniffStreamContext->m_audioIndex) {

        if (sniffStreamContext->m_aStartTime < 0) {
            sniffStreamContext->m_aStartTime =
                    (sniffStreamContext->m_avPacket->dts < sniffStreamContext->m_avPacket->pts) ?
                    sniffStreamContext->m_avPacket->dts : sniffStreamContext->m_avPacket->pts;
            //printf("debug m_aStartTime %f\n", sniffStreamContext->m_aStartTime * sniffStreamContext->m_aTimebase);
        }

        sniffStreamContext->m_avPacket->dts -= sniffStreamContext->m_aStartTime;
        sniffStreamContext->m_avPacket->pts -= sniffStreamContext->m_aStartTime;

        // test
        //aac_decode_extradata(&AdtsCtx,
        //        sniffStreamContext->m_aCodecContext->extradata,
        //        sniffStreamContext->m_aCodecContext->extradata_size);
        //
        //printf("aac_decode_extradata ==> samplerateIdx:%d channel:%d objectType:%d\n", AdtsCtx.sample_rate_index, AdtsCtx.channel_conf, AdtsCtx.objecttype);

        unsigned char bits[7] = {0};
        int aac_frame_length = 7 + sniffStreamContext->m_avPacket->size;
        int sample_index = find_sample_index(sniffStreamContext->m_mediaInfo.a_out_sample_rate);
        int channels = sniffStreamContext->m_mediaInfo.a_channel;
        if (channels == 8) {
            channels = 7;
        }
        //printf("aac_decode_extradata ==> sampleRate:%d samplerateIdx:%d "
        //       "channel:%d aac_frame_length:%d profile:%d\n",
        //       sniffStreamContext->m_mediaInfo.a_out_sample_rate, sample_index,
        //       channels, aac_frame_length, sniffStreamContext->m_mediaInfo.a_profile);

        bits[0] = 0xff;
        bits[1] = 0xf1;

        // adtsHead[2] = (((profile - 1) << 6) + (freqIdx << 2) + (chanCfg >> 2));
        bits[2] = ((sniffStreamContext->m_mediaInfo.a_profile - 1) << 6) + (sample_index << 2) +(channels >> 2) ;
        //bits[2] |= (sample_index << 2);
        //bits[2] |= (channels >> 2);

        // adtsHead[3] = (((chanCfg & 3) << 6) + (packetLen >> 11));
        bits[3] = ((channels & 3) << 6) + (aac_frame_length >> 11);
        //bits[3] |= (aac_frame_length >> 11);

        // adtsHead[4] = ((packetLen & 0x7FF) >> 3);
        bits[4] = ((aac_frame_length & 0x7FF) >> 3);

        // adtsHead[5] = (((packetLen & 7) << 5) + 0x1F);
        bits[5] = ((aac_frame_length & 7) << 5) + 0x1F;
        //bits[5] |= (0x7FF >> 6);

        // adtsHead[6] = 0xfc;
        bits[6] = 0xfc;

        //fwrite(bits, 1,
        //       7, g_test_f_aac);
        //// body
        //fwrite(sniffStreamContext->m_avPacket->data, 1,
        //        sniffStreamContext->m_avPacket->size, g_test_f_aac);

        double a_pts = sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_aTimebase;
        sniffStreamContext->m_decLastPTS = pts_fixed_2(MAX(sniffStreamContext->m_decLastPTS, a_pts));

        if (sniffStreamContext->isSetCallback > 0) {

            int aacLen = sniffStreamContext->m_avPacket->size + 7;
            uint8_t *aacFrame = (uint8_t *) malloc(sizeof(uint8_t) * aacLen);

            //printf("debug start getSniffStreamPacketFunc 5.2\n");
            int appendIdx = 0;

            memcpy(aacFrame + appendIdx, bits, 7);
            appendIdx += 7;

            memcpy(aacFrame + appendIdx, sniffStreamContext->m_avPacket->data,
                   sniffStreamContext->m_avPacket->size);

            if (skip > 0) {
                // ...
            } else {
                // EM_ASM_(
                //         {
                //                 postMessage(
                //                         {
                //                                 cmd:"go",
                //                                 data: {
                //                                         type: "audio",
                //                                         corePtr: $0,
                //                                         adts: $1,
                //                                         data: $2,
                //                                         size: $3,
                //                                         channels: $4,
                //                                         v_pts: $5
                //                                 }
                //                         }
                //                 );
                //         },
                //         sniffStreamContext,
                //         bits,
                //         sniffStreamContext->m_avPacket->data,
                //         sniffStreamContext->m_avPacket->size,
                //         sniffStreamContext->m_aCodecContext->channels,
                //         sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_aTimebase
                // );
                sniffStreamContext->aacSamplesCallback(
                        // bits,
                        // sniffStreamContext->m_avPacket->data,
                        aacFrame,
                        sniffStreamContext->m_avPacket->size + 7,
                        sniffStreamContext->m_aCodecContext->channels,
                        sniffStreamContext->m_avPacket->pts * sniffStreamContext->m_aTimebase);
            } // end call aac

            if (NULL != aacFrame) {
                free(aacFrame);
                aacFrame = NULL;
                aacLen = 0;
                appendIdx = 0;
            }
        } // end if isSetCallback


        /*
         * Decode Audio Frame
         */
        //printf("Get Audio!\n");
        ret = MISSILE_PKT_GET_TYPE_AAC;
    } else {
        ret = MISSILE_PKT_GET_NOTHING;
        //printf("Get Nothing!\n");
    }

    av_packet_unref(sniffStreamContext->m_avPacket);
    //free(sniffStreamContext->m_avPacket);
    //sniffStreamContext->m_avPacket = NULL;
    return ret;
}

int seekBufferFunc(SniffStreamContext *sniffStreamContext, double seek_pos) {
    //printf("seekBufferFunc\n");

    sniffStreamContext->m_seekDesc.m_seekStatus = SEEK_STATUS_OPTION_BUSY;
    sniffStreamContext->m_seekDesc.m_seekPos = seek_pos;
    sniffStreamContext->m_seekDesc.m_seekBusyPos = 0.0;

    // start
    //#define AVSEEK_FLAG_BACKWARD 1 ///< seek backward
    //#define AVSEEK_FLAG_BYTE     2 ///< seeking based on position in bytes
    //#define AVSEEK_FLAG_ANY      4 ///< seek to any frame, even non-keyframes
    //#define AVSEEK_FLAG_FRAME    8 ///< seeking based on frame number
    int ret = av_seek_frame(sniffStreamContext->m_formatCtx,
                            -1, // sniffStreamContext->m_videoIndex
                            seek_pos / sniffStreamContext->m_vTimebase, // seek_pos / sniffStreamContext->m_vTimebase,
                            AVSEEK_FLAG_BACKWARD);
    avcodec_flush_buffers(sniffStreamContext->m_vCodecContext);
    avcodec_flush_buffers(sniffStreamContext->m_aCodecContext);

    int decRet = 0;
    while (1) {
        decRet = getSniffStreamPacketFunc(sniffStreamContext, 1, 1);
        if (decRet < 0) {
            //printf("seekBufferFunc --> getSniffStreamPacketFunc FAILED:%d\n", decRet);
        }
        //printf("seek ing :%f\n", sniffStreamContext->m_seekDesc.m_seekBusyPos);
        if (sniffStreamContext->m_seekDesc.m_seekBusyPos >= seek_pos) {
            break;
        }
    }

    // end
    sniffStreamContext->m_seekDesc.m_seekStatus = SEEK_STATUS_OPTION_IDLE;
    sniffStreamContext->m_seekDesc.m_seekPos = 0.0;
    sniffStreamContext->m_seekDesc.m_seekBusyPos = 0.0;

    return ret;
}

//int splitBufferFunc(SniffStreamContext *sniffStreamContext, double start, double end) {
//    if (start >= end) {
//        return -1;
//    }
//    if (start < 0 || start >= sniffStreamContext->m_mediaInfo.v_duration) {
//        return -2;
//    }
//    if (end < 0 || end > sniffStreamContext->m_mediaInfo.v_duration) {
//        return -3;
//    }
//
//    int seekRet = sniffStreamContext->seekBufferFunc(sniffStreamContext, start);
//    if (seekRet < 0) {
//        printf("seekRet failed:%d\n", seekRet);
//        return seekRet;
//    }
//
//    printf("seekRet successed, then make split params\n");
//    //if (NULL == sniffStreamContext->m_videoNode) {
//    //    sniffStreamContext->m_videoNode = NLE_instanceVideoNode();
//    //}
//    //sniffStreamContext->m_videoNode->m_splitDur = end - start;
//    //sniffStreamContext->m_videoNode->m_splitStart = start;
//    //sniffStreamContext->m_videoNode->m_splitEnd = end;
//
//    return 0;
//}

int pushBufferFunc(
        SniffStreamContext *sniffStreamContext,
        uint8_t *buf, int buf_size,
        int probe_size, int file_size)
{
    if (buf_size < 0 || buf == NULL) {
        return 0;
    }
    // set point
    sniffStreamContextTempPtr = sniffStreamContext;
    // copy to mem
    //printf("==========================================================================memcpy start\n");
    //printf("probe size: %d\n", probe_size);

    if (sniffStreamContext != NULL) {
        //printf("add sniffStreamContext->m_bd.size:%zu\n", sniffStreamContext->m_bd.size);
        //if (sniffStreamContext->m_bd.file_size <= 0) {
        //    printf("set file size:%d\n", file_size);
        //    sniffStreamContext->m_bd.file_size = file_size;
        //}
        if (sniffStreamContext->m_bd.ptr == NULL) {
            //printf("push init 1: sniffStreamContext->m_bd.size:%zu: input filesize:%d\n", sniffStreamContext->m_bd.size, file_size);

            sniffStreamContext->m_bd.ptr = (uint8_t *) malloc(sizeof(uint8_t) * buf_size);
            memcpy(sniffStreamContext->m_bd.ptr, buf, buf_size);

            //sniffStreamContext->m_bd.resource = (uint8_t *) malloc(sizeof(uint8_t) * buf_size);
            //memcpy(sniffStreamContext->m_bd.resource, buf, buf_size);

            sniffStreamContext->m_bd.size = buf_size;
            //sniffStreamContext->m_bd.ori_ptr = sniffStreamContext->m_bd.ptr;

            //sniffStreamContext->m_bd.ptr = sniffStreamContext->m_bd.resource;
            //sniffStreamContext->m_bd.ori_ptr = sniffStreamContext->m_bd.resource;
            //printf(">>>  memcpy done\n");
        } else {
            //printf("push add 1\n");
            //// remalloc
            uint8_t *dst = reMallocU8(
                    sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.file_size, buf, buf_size);

            //printf("start re malloc free %p %d %d %d step %d %d\n",
            //       m_bd.ptr, m_bd.ptr[0], m_bd.ptr[1], m_bd.ptr[2], m_bd.ptr == NULL, m_bd.size);

            if (sniffStreamContext->m_bd.ptr != NULL) {
                free(sniffStreamContext->m_bd.ptr);
                sniffStreamContext->m_bd.ptr = NULL;
            }

            sniffStreamContext->m_bd.ptr = dst;
            sniffStreamContext->m_bd.size += buf_size;

            //uint8_t *dst = reMallocU8(
            //        sniffStreamContext->m_bd.ptr, sniffStreamContext->m_bd.file_size, buf, buf_size);
            //
            ////printf("start re malloc free %p %d %d %d step %d %d\n",
            ////       m_bd.ptr, m_bd.ptr[0], m_bd.ptr[1], m_bd.ptr[2], m_bd.ptr == NULL, m_bd.size);
            //
            //if (sniffStreamContext->m_bd.ptr != NULL) {
            //    free(sniffStreamContext->m_bd.ptr);
            //    sniffStreamContext->m_bd.ptr = NULL;
            //}
            //
            ////sniffStreamContext->m_bd.ptr = sniffStreamContext->m_bd.resource;
            //sniffStreamContext->m_bd.ptr = dst;
            //printf("end re malloc done + %d = %zu\n", buf_size, sniffStreamContext->m_bd.size);
        }

    } else {
        return -1;
    }
    sniffStreamContext->m_bd.file_size += buf_size;
    //printf("========> bd total: %d\n", sniffStreamContext->m_bd.file_size);


    int avRet = 0;
    // init
    if (sniffStreamContext != NULL && sniffStreamContext->m_piFmt == NULL) {
        // sniffStreamContext->m_frame = av_frame_alloc();
        // //sniffStreamContext->m_aFrame = av_frame_alloc();
        // //if (!sniffStreamContext->m_frame || !sniffStreamContext->m_aFrame) {
        // if (!sniffStreamContext->m_frame) {
        //     printf("frame alloc failed!\n");
        //     return -1;
        // }

        uint8_t *bufPb = (uint8_t *)malloc(sizeof(uint8_t) * BUF_SIZE);
        // run read_stream
        //sniffStreamContext->m_pb = avio_alloc_context(
        //        bufPb, BUF_SIZE, 0, &m_bd, read_stream, NULL, NULL);
        if (sniffStreamContext->m_mode == MISSILE_SNIFFSTREAM_MODE_LIVE) {
            sniffStreamContext->m_pb = avio_alloc_context(
                    bufPb, BUF_SIZE, 0, sniffStreamContext, read_stream_live, NULL, NULL);
        } else {
            sniffStreamContext->m_pb = avio_alloc_context(
                    bufPb, BUF_SIZE, 0, sniffStreamContext,
                    read_stream_vod, NULL, seek_in_buffer);
        }

        avRet = av_probe_input_buffer(
                sniffStreamContext->m_pb, &sniffStreamContext->m_piFmt, "", NULL, 0, 0);
        if (avRet < 0) {
            printf("probe format failed msg: %s\n", getCodeMsg(avRet));
            return -1;
        } else {

            const int cmpHevcFormat = STRCMP("hevc", sniffStreamContext->m_piFmt->name);
            if (cmpHevcFormat == 0) {
                sniffStreamContext->m_isRawStream = 1;
            } else {
                sniffStreamContext->m_isRawStream = 0;
            }

            printf("format:%s[%s]\n", sniffStreamContext->m_piFmt->name,
                   sniffStreamContext->m_piFmt->long_name);
        }

        sniffStreamContext->m_formatCtx = avformat_alloc_context();
        sniffStreamContext->m_formatCtx->pb = sniffStreamContext->m_pb;
        sniffStreamContext->m_formatCtx->flags = AVFMT_FLAG_CUSTOM_IO;

        sniffStreamContext->m_avPacket = (AVPacket *)av_malloc(sizeof(AVPacket));
        av_init_packet(sniffStreamContext->m_avPacket);
    }

    if (sniffStreamContext->m_probe < 1 && sniffStreamContext->m_bd.file_size >= probe_size) {

        // >= PROBE_SIZE
        //printf("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv\n");
        AVDictionary* options = NULL;
        // (const char *) (409600 * sniffStreamContext->m_probeRetry)
        av_dict_set(&options,
                "buffer_size", "409600", 0); //设置缓存大小，1080p可将值调大
        avRet = avformat_open_input(
                &sniffStreamContext->m_formatCtx, "", sniffStreamContext->m_piFmt, &options);
        //avRet = avformat_open_input(
        //        &sniffStreamContext->m_formatCtx, "", NULL, NULL);
        if (avRet != 0) {
            //iformat，priv_data赋值，pb, nbstreams,streams为null
            printf("Couldn't open input stream）: %d, %s\n", avRet, getCodeMsg(avRet));
            if (sniffStreamContext->m_probeRetry < MISSILE_SNIFFSTREAM_VOD_MAX_RETRY_PROBE) {
                sniffStreamContext->m_probeRetry += 1;
                printf("Start retry open input stream）: %d\n", sniffStreamContext->m_probeRetry);
                return 400;
            }
            return -2;
        }

        avRet = avformat_find_stream_info(sniffStreamContext->m_formatCtx, NULL);
        if (avRet < 0) {
            printf("Couldn't find stream information.）: %d %s\n", avRet, getCodeMsg(avRet));
            return -3;
        }

        sniffStreamContext->m_videoIndex = -1;
        int find = 0;
        for (int i = 0; i < sniffStreamContext->m_formatCtx->nb_streams; i++) {
            AVStream *contex_stream = sniffStreamContext->m_formatCtx->streams[i];
            enum AVCodecID codecId = contex_stream->codecpar->codec_id;

            if (contex_stream->codec->codec_type == AVMEDIA_TYPE_VIDEO) {
                sniffStreamContext->m_videoIndex = i;
                find += 1;

                if (codecId == AV_CODEC_ID_H265 || codecId == AV_CODEC_ID_HEVC) {
                    sniffStreamContext->m_vCodec = V_CODEC_NAME_HEVC;
                } else if (codecId == AV_CODEC_ID_H264) {
                    sniffStreamContext->m_vCodec = V_CODEC_NAME_AVC;
                }

                //if (sniffStreamContext->isSetCallback > 0) {
                //    sniffStreamContext->probeCallback(
                //            sniffStreamContext->m_mediaInfo.duration,
                //            sniffStreamContext->m_mediaInfo.width,
                //            sniffStreamContext->m_mediaInfo.height,
                //            sniffStreamContext->m_mediaInfo.fps,
                //            sniffStreamContext->m_mediaInfo.a_out_sample_rate,
                //            sniffStreamContext->m_mediaInfo.a_out_channel,
                //            sniffStreamContext->m_vCodec,
                //            sniffStreamContext->m_mediaInfo.a_out_sample_fmt);
                //}

                sniffStreamContext->m_mediaInfo.width = contex_stream->codec->width;
                sniffStreamContext->m_mediaInfo.height = contex_stream->codec->height;
                sniffStreamContext->m_vTimebase = av_q2d(contex_stream->time_base);

                /*
                 * Decoder
                 */
                AVCodec *dec = avcodec_find_decoder(codecId);
                const char* codec_name = avcodec_get_name(codecId);
                printf("video codec name:%s\n", codec_name);
                //const char* codecName = avcodec_get_name(codecId);
                //const char *codec_name = avcodec_get_name(sniffStreamContext->m_vCodecContext->codec_id);

                if (contex_stream->duration < 0) {
                    //printf("debug contex_stream->duration < 0\n");
                    sniffStreamContext->m_mediaInfo.v_duration =
                            sniffStreamContext->m_formatCtx->duration / (double) AV_TIME_BASE;
                } else {
                    //printf("debug contex_stream->duration >= 0\n");
                    sniffStreamContext->m_mediaInfo.v_duration =
                            contex_stream->duration * sniffStreamContext->m_vTimebase;
                }

                if (sniffStreamContext->m_mediaInfo.v_duration <= 0) {
                    sniffStreamContext->m_mediaInfo.v_duration = sniffStreamContext->m_mediaInfo.a_duration;
                }

                sniffStreamContext->m_mediaInfo.duration =
                        sniffStreamContext->m_mediaInfo.v_duration;
                const double streamFps = av_q2d(contex_stream->r_frame_rate);
                sniffStreamContext->m_mediaInfo.fps = streamFps > 0.0 ? streamFps : sniffStreamContext->m_defaultFps;
                sniffStreamContext->m_frameDuration = 1.0 / sniffStreamContext->m_mediaInfo.fps;

                if (!dec) {
                    printf("Failed to find decoder video for stream #%u codec:%s\n", i, codec_name);
                    //return AVERROR_DECODER_NOT_FOUND;
                } else {

                    // hard copy video codec name
                    //sniffStreamContext->m_vCodec = (char *) malloc(sizeof(codec_name));
                    //strcpy(sniffStreamContext->m_vCodec, codec_name);

                    sniffStreamContext->m_vCodecContext = avcodec_alloc_context3(dec);
                    if (!sniffStreamContext->m_vCodecContext) {
                        printf("Failed to allocate the video decoder context for stream #%u\n", i);
                        return AVERROR(ENOMEM);
                    }
                    avRet = avcodec_parameters_to_context(
                            sniffStreamContext->m_vCodecContext, contex_stream->codecpar);
                    if (avRet < 0) {
                        printf("Failed to copy video decoder parameters to input decoder context "
                               "for stream #%u\n", i);
                        return avRet;
                    }

                    //const char *codec_name = avcodec_get_name(sniffStreamContext->m_vCodecContext->codec_id);
                    //printf("video codec name:%s\n", codec_name);
                    //if (avcodec_open2(
                    //        sniffStreamContext->m_vCodecContext, dec, NULL) < 0) {
                    if (avcodec_open2(
                            sniffStreamContext->m_vCodecContext, dec, 0) < 0) {
                        printf("init video decoder failed\n");
                        return -1;
                    }


                    // if (contex_stream->duration < 0) {
                    //     //printf("debug contex_stream->duration < 0\n");
                    //     sniffStreamContext->m_mediaInfo.v_duration =
                    //             sniffStreamContext->m_formatCtx->duration / (double) AV_TIME_BASE;
                    // } else {
                    //     //printf("debug contex_stream->duration >= 0\n");
                    //     sniffStreamContext->m_mediaInfo.v_duration =
                    //             contex_stream->duration * sniffStreamContext->m_vTimebase;
                    // }
                    //
                    // if (sniffStreamContext->m_mediaInfo.v_duration <= 0) {
                    //     sniffStreamContext->m_mediaInfo.v_duration = sniffStreamContext->m_mediaInfo.a_duration;
                    // }
                    //
                    // sniffStreamContext->m_mediaInfo.duration =
                    //         sniffStreamContext->m_mediaInfo.v_duration;
                    // sniffStreamContext->m_mediaInfo.fps = av_q2d(contex_stream->r_frame_rate);

                    //printf("debug video duration param: \n"
                    //       "d:%lld,tb:%f, \n"
                    //       "d:%lld,tb:%d, \n"
                    //       "duration %f\n"
                    //       "duration %f\n",
                    //       contex_stream->duration, sniffStreamContext->m_vTimebase,
                    //       sniffStreamContext->m_formatCtx->duration, AV_TIME_BASE,
                    //       contex_stream->duration * sniffStreamContext->m_vTimebase,
                    //       sniffStreamContext->m_formatCtx->duration / (double)AV_TIME_BASE);
                    //printf("debug video duration param: \n"
                    //       "d:%lld,tb:%f, \n"
                    //       "d:%lld,tb:%d, \n"
                    //       "duration %f\n"
                    //       "duration %f\n"
                    //       "res:%f %f\n",
                    //       contex_stream->duration, sniffStreamContext->m_vTimebase,
                    //       sniffStreamContext->m_formatCtx->duration, AV_TIME_BASE,
                    //       contex_stream->duration * sniffStreamContext->m_vTimebase,
                    //       sniffStreamContext->m_formatCtx->duration / (double)AV_TIME_BASE,
                    //       sniffStreamContext->m_mediaInfo.v_duration, sniffStreamContext->m_mediaInfo.duration);
                } // check find decoder for codec
            }

            if (contex_stream->codec->codec_type == AVMEDIA_TYPE_AUDIO) { // sniffStreamContext->m_ignoreAudio == 0 &&
                sniffStreamContext->m_audioIndex = i;
                find += 1;
                sniffStreamContext->m_aTimebase = av_q2d(contex_stream->time_base);

                //sniffStreamContext->m_formatCtx->
                //printf("debug audio sample rate: %d\n", contex_stream->codecpar->sample_rate);
                //printf("debug audio sample channels: %d\n", contex_stream->codecpar->channels);
                //printf("debug audio sample profile: %d\n", sniffStreamContext->);
                //printf("debug audio sample duration: %f\n", contex_stream->duration * sniffStreamContext->m_aTimebase);
                //
                //enum AVSampleFormat sampleFormat = contex_stream->codec->sample_fmt;
                //const char *sample_fmt = av_get_sample_fmt_name(sampleFormat);
                //sniffStreamContext->m_mediaInfo.a_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                //strcpy(sniffStreamContext->m_mediaInfo.a_sample_fmt, sample_fmt);
                //
                //printf("debug audio sample fmt: %s\n", sniffStreamContext->m_mediaInfo.a_sample_fmt);
                //
                //sniffStreamContext->m_mediaInfo.a_sample_rate   = contex_stream->codecpar->sample_rate;
                //sniffStreamContext->m_mediaInfo.a_channel       = contex_stream->codecpar->channels;
                //sniffStreamContext->m_mediaInfo.a_profile       = contex_stream->codec->profile;

                // audio
                AVCodec *dec = avcodec_find_decoder(codecId);
                const char* codecName = avcodec_get_name(codecId);
                if (!dec) {
                    printf("Failed to find audio decoder for stream #%u codec:%s\n", i, codecName);
                    return AVERROR_DECODER_NOT_FOUND;
                }
                sniffStreamContext->m_aCodecContext = avcodec_alloc_context3(dec);
                if (!sniffStreamContext->m_aCodecContext) {
                    printf("Failed to allocate the audio decoder context for stream #%u\n", i);
                    return AVERROR(ENOMEM);
                }
                avRet = avcodec_parameters_to_context(
                        sniffStreamContext->m_aCodecContext, contex_stream->codecpar);
                if (avRet < 0) {
                    printf("Failed to copy audio decoder parameters to input decoder context "
                           "for stream #%u\n", i);
                    return avRet;
                }

                const char *codec_name = avcodec_get_name(sniffStreamContext->m_aCodecContext->codec_id);
                printf("audio codec name:%s\n", codec_name);
                if (avcodec_open2(
                        sniffStreamContext->m_aCodecContext, dec, NULL) < 0) {
                    printf("init open audio decoder failed\n");
                    return -1;
                }

                // media sample format
                enum AVSampleFormat sampleFormat = sniffStreamContext->m_aCodecContext->sample_fmt;
                const char *sample_fmt = av_get_sample_fmt_name(sampleFormat);
                sniffStreamContext->m_mediaInfo.a_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                strcpy(sniffStreamContext->m_mediaInfo.a_sample_fmt, sample_fmt);

                // sample rate channel info
                sniffStreamContext->m_mediaInfo.a_sample_rate   = sniffStreamContext->m_aCodecContext->sample_rate;
                sniffStreamContext->m_mediaInfo.a_channel       = sniffStreamContext->m_aCodecContext->channels;
                sniffStreamContext->m_mediaInfo.a_profile       = sniffStreamContext->m_aCodecContext->profile;

                if (sampleFormat == AV_SAMPLE_FMT_FLTP) {
                    sniffStreamContext->m_needSwr = 0;
                    sniffStreamContext->m_mediaInfo.a_out_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                    strcpy(sniffStreamContext->m_mediaInfo.a_out_sample_fmt, sample_fmt);

                    // out sample rate channel info
                    sniffStreamContext->m_mediaInfo.a_out_sample_rate   = sniffStreamContext->m_aCodecContext->sample_rate;
                    sniffStreamContext->m_mediaInfo.a_out_channel       = sniffStreamContext->m_aCodecContext->channels;

                } else {
                    sniffStreamContext->m_needSwr = 1;
                    // out sample format
                    const char *sample_out_fmt = av_get_sample_fmt_name(OUT_SAMPLE_FMT);
                    sniffStreamContext->m_mediaInfo.a_out_sample_fmt = (char *) malloc(sizeof(sample_out_fmt));
                    strcpy(sniffStreamContext->m_mediaInfo.a_out_sample_fmt, sample_out_fmt);

                    // out sample rate channel info
                    sniffStreamContext->m_mediaInfo.a_out_sample_rate   = OUT_SAMPLE_RATE;
                    sniffStreamContext->m_mediaInfo.a_out_channel       = OUT_CHANNEL_NB;

                    //sniffStreamContext->m_swrCtx = swr_alloc();                     //音频重采样上下文
                    //swr_alloc_set_opts(
                    //        sniffStreamContext->m_swrCtx,
                    //        sniffStreamContext->m_mediaInfo.a_out_channel,
                    //        OUT_SAMPLE_FMT,
                    //        sniffStreamContext->m_mediaInfo.a_out_sample_rate,
                    //        sniffStreamContext->m_aCodecContext->channel_layout,
                    //        sniffStreamContext->m_aCodecContext->sample_fmt,
                    //        sniffStreamContext->m_aCodecContext->sample_rate, 0, NULL);
                    //swr_init(sniffStreamContext->m_swrCtx);
                }

                // duration
                if (contex_stream->duration < 0) {
                    sniffStreamContext->m_mediaInfo.a_duration = sniffStreamContext->m_mediaInfo.v_duration;
                } else {
                    sniffStreamContext->m_mediaInfo.a_duration =
                            contex_stream->duration * sniffStreamContext->m_aTimebase;
                }

                //printf("debug audio duration param: \nd:%lld,tb:%f, \nduration %f\n",
                //       contex_stream->duration, sniffStreamContext->m_vTimebase,
                //       contex_stream->duration * sniffStreamContext->m_vTimebase);
            }

            if (find >= 2) {
                sniffStreamContext->m_mediaInfo.duration =
                        MIN(sniffStreamContext->m_mediaInfo.v_duration, sniffStreamContext->m_mediaInfo.a_duration);
                //av_dump_format(sniffStreamContext->m_formatCtx, 0, "", 0);
                break;
            }
        }

        if (sniffStreamContext->m_videoIndex == -1) {
            printf("Didn't find a video stream.（没有找到视频流）\n");
            return -4;
        } else {
            printf("find video audio stream info %d %d\n",
                   sniffStreamContext->m_videoIndex, sniffStreamContext->m_audioIndex);
        }

        /*
         * nalu bsf
         */
        // sniffStreamContext->m_decPacket = av_packet_alloc();
        // av_init_packet(sniffStreamContext->m_decPacket);
        // if (!sniffStreamContext->m_decPacket) {
        //     printf("av_frame_alloc-packet 初始化解码器失败\n");
        //     return -1;
        // }
        //
        // // avcodec_find_decoder(AV_CODEC_ID_HEVC)
        // // @TODO 这个地方到时候直接换成codecId 上文获取的值
        // sniffStreamContext->m_vDecCodec = avcodec_find_decoder(AV_CODEC_ID_HEVC);
        // //sniffStreamContext->m_vDecCodec = avcodec_find_decoder(AV_CODEC_ID_H264);
        // sniffStreamContext->m_vDecCodecContext = avcodec_alloc_context3(sniffStreamContext->m_vDecCodec);
        // if (avcodec_open2(sniffStreamContext->m_vDecCodecContext, sniffStreamContext->m_vDecCodec, NULL) < 0) {
        //     printf("init open video single decoder failed\n");
        //     return -1;
        // }

        // mp4 to hevc nalu filter
        sniffStreamContext->m_absFilter = NULL;
        sniffStreamContext->m_absCtx = NULL;
        // @TODO 这个地方到时候直接换成codecId 上文获取的值来判断
        sniffStreamContext->m_absFilter = (AVBitStreamFilter *)av_bsf_get_by_name("hevc_mp4toannexb");
        //过滤器分配内存
        av_bsf_alloc(sniffStreamContext->m_absFilter, &sniffStreamContext->m_absCtx);

        avcodec_parameters_copy(
                sniffStreamContext->m_absCtx->par_in,
                sniffStreamContext->m_formatCtx->streams[sniffStreamContext->m_videoIndex]->codecpar);
        av_bsf_init(sniffStreamContext->m_absCtx);

        /*
         * Probe Callback
         * sniffStreamContext->m_mediaInfo
         */
        if (sniffStreamContext->isSetCallback > 0) {
            printf("native------------------> probeCallback:%ld \n",
                   (long) sniffStreamContext->probeCallback);
            sniffStreamContext->probeCallback(
                    sniffStreamContext->m_mediaInfo.duration,
                    sniffStreamContext->m_mediaInfo.width,
                    sniffStreamContext->m_mediaInfo.height,
                    sniffStreamContext->m_mediaInfo.fps,
                    sniffStreamContext->m_audioIndex,
                    sniffStreamContext->m_mediaInfo.a_out_sample_rate,
                    sniffStreamContext->m_mediaInfo.a_out_channel,
                    sniffStreamContext->m_vCodec,
                    sniffStreamContext->m_mediaInfo.a_out_sample_fmt);
        }

        sniffStreamContext->m_probe = 1;

        printf("native------------------> probe ret : %d[%f]\n",
                sniffStreamContext->m_probe, sniffStreamContext->m_mediaInfo.fps);

#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)
        // pthread_t pt;
        // void *ret = NULL;
        // sniffStreamContext->m_threadRefresh = MISSILE_PTHREAD_ALREADY_CREATE;
        pthread_create(&sniffStreamContext->m_decThread_0, NULL, decThread, sniffStreamContext);
        // pthread_join(pt, ret);
        // pthread_detach(pt);
#endif
        return 1;
    }
    return 0;
}

/**
 * setCodecTypeFunc
 * @param sniffStreamContext
 * @param callback
 * @return
 */
int setSniffStreamCodecTypeFunc(
        SniffStreamContext *sniffStreamContext,
        long probeCallback, long yuvCallback,
        long naluCallback, long pcmCallback, long aacCallback,
        int ignoreAudio, double defaultFps) {
    //sniffStreamContext->streamCallback = (StreamCallback) callback;
    sniffStreamContext->probeCallback = (ProbeCallback) probeCallback;
    //sniffStreamContext->rgb24FrameCallback = (RGB24FrameCallback) rgb24FrameCallback;
    sniffStreamContext->yuvFrameCallback = (YUVFrameCallback) yuvCallback;
    sniffStreamContext->naluFrameCallback = (NaluVodFrameCallback) naluCallback;
    sniffStreamContext->pcmSamplesCallback = (PCMSamplesCallback) pcmCallback;
    sniffStreamContext->aacSamplesCallback = (AACSamplesCallback) aacCallback;

    sniffStreamContext->isSetCallback = 1;
    sniffStreamContext->m_ignoreAudio = ignoreAudio;
    sniffStreamContext->m_defaultFps = defaultFps;
    return 0;
} // setSniffStreamCodecTypeFunc

int naluLListLengthFunc(SniffStreamContext *sniffStreamContext) {
    if (sniffStreamContext == NULL) {
        return -1;
    }

    if (sniffStreamContext->m_avDecNaluLinkList == NULL) {
        return -1;
    }

    return sniffStreamContext->m_avDecNaluLinkList->length;
} // naluLListLengthFunc

/**
 *
 ************************************** @outside functions
 *
 */
SniffStreamContext *newSniffStreamContext() {

#ifdef __EMSCRIPTEN__
    printf("is ===============> __EMSCRIPTEN__\n");
#endif
    SniffStreamContext *sniffStreamContext =
            (SniffStreamContext *)malloc(sizeof(SniffStreamContext));
    av_log_set_level(AV_LOG_QUIET);

    sniffStreamContext->m_mode              = MISSILE_SNIFFSTREAM_MODE_VOD;
    sniffStreamContext->initFunc            = initSniffStreamFunc;
    sniffStreamContext->releaseFunc         = releaseSniffStreamFunc;
    sniffStreamContext->introduceMineFunc   = introduce_mine;
    sniffStreamContext->pushBufferFunc      = pushBufferFunc;
    sniffStreamContext->seekBufferFunc      = seekBufferFunc;
    //sniffStreamContext->splitBufferFunc     = splitBufferFunc;
    sniffStreamContext->getPacketFunc       = getSniffStreamPacketFunc;
    sniffStreamContext->decodeVideoFrameFunc= decodeVideoFrameFunc;
    sniffStreamContext->naluLListLengthFunc = naluLListLengthFunc;
    sniffStreamContext->setCodecTypeFunc    = setSniffStreamCodecTypeFunc;
    return sniffStreamContext;
}

int releaseSniffStreamContext(SniffStreamContext *sniffStreamContext) {
    printf("exec release sniff stream ctx\n");
    if (sniffStreamContext == NULL) {
        return -1;
    }

    int ret = sniffStreamContext->releaseFunc(sniffStreamContext);

    sniffStreamContext->initFunc            = NULL;
    sniffStreamContext->introduceMineFunc   = NULL;
    sniffStreamContext->pushBufferFunc      = NULL;
    sniffStreamContext->seekBufferFunc      = NULL;
    //sniffStreamContext->splitBufferFunc     = NULL;
    sniffStreamContext->getPacketFunc       = NULL;
    sniffStreamContext->decodeVideoFrameFunc= NULL;
    sniffStreamContext->naluLListLengthFunc = NULL;
    sniffStreamContext->setCodecTypeFunc    = NULL;
    sniffStreamContext->releaseFunc         = NULL;

    printf("code of release sniff stream ctx:%d\n", ret);
    return ret;
}
