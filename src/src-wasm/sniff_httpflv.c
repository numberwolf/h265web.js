//
// Created by 小老虎 on 2020/10/11.
//

#include <emscripten.h>
// #include <pthread.h>
#include <unistd.h>
// #include <time.h>
#include "sniff_httpflv.h"

#include "about.h"
#include "utils/tools.h"
#include "utils/av_err_code.h"
#include "utils/common_string.h"
#include "decoder/const_codec.h"

/**
 *
 ********************************* Global Define Const Value @Private *************************
 *
 */
/************************ Sniff Module ***************************/
#define HFLV_PROBE_SIZE          4096 * 1000
#define HFLV_BUF_SIZE            4096
#define HFLV_PUSH_UNIT           1
#define HFLV_DEFAULT_SAMPLE_RATE 44100
#define HFLV_DEFAULT_FPS         24

#define HFLV_DECODE_EOF_CODE     -404
#define HFLV_CODEC_NAME_LEN      128

const enum AVSampleFormat   HFLV_OUT_SAMPLE_FMT  = AV_SAMPLE_FMT_FLTP;   // 输出的采样格式 16bit PCM
const int                   HFLV_OUT_SAMPLE_RATE = 44100;                // 输出的采样率
/*
 * AV_CH_LAYOUT_MONO    单声道 NB = 1
 * AV_CH_LAYOUT_STEREO  双声道 NB = 2
 */
const uint64_t              HFLV_OUT_CN_LAYOUT   = AV_CH_LAYOUT_MONO;    // 输出的声道布局
const int                   HFLV_OUT_CHANNEL_NB  = 1;

const unsigned char         HFLV_STARTCODE[4] = {0x00, 0x00, 0x00, 0x01};
const unsigned char         HFLV_TEST_STARTCODE[4] = {0xEE, 0xEE, 0xEE, 1};


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

/**
 *
 ************************************** @private functions
 ************************************** @member
 *
 */

//FILE *g_test_f_aac = NULL;
typedef struct {
    int write_adts;
    int objecttype;
    int sample_rate_index;
    int channel_conf;
} ADTSContext;
ADTSContext               AdtsCtx;
#define  ADTS_HEADER_SIZE 8

/**
 *
 * @param sniffHttpFlvContext
 * @param isRelease 0 no 1 yes
 * @return
 */
//void cleanAvYuvFrame(SniffHTTPFLVContext *sniffHttpFlvContext, MISSILE_CMD_IS_RELEASE_TYPE isRelease) {
//    if (NULL != sniffHttpFlvContext->m_missileAvYuvFrame.luma && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
//        free(sniffHttpFlvContext->m_missileAvYuvFrame.luma);
//    }
//    sniffHttpFlvContext->m_missileAvYuvFrame.luma = NULL;
//
//    if (NULL != sniffHttpFlvContext->m_missileAvYuvFrame.chromaB && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
//        free(sniffHttpFlvContext->m_missileAvYuvFrame.chromaB);
//    }
//    sniffHttpFlvContext->m_missileAvYuvFrame.chromaB = NULL;
//
//    if (NULL != sniffHttpFlvContext->m_missileAvYuvFrame.chromaR && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
//        free(sniffHttpFlvContext->m_missileAvYuvFrame.chromaR);
//    }
//    sniffHttpFlvContext->m_missileAvYuvFrame.chromaR = NULL;
//}

/**
 * 实质进行的是读取已有内存的size数据，拷贝到buf中。opaque方便参数传递。注意，在拷贝时要对pos累加。
 * @param opaque
 * @param buf
 * @param buf_size
 * @return
 */
//int read_stream_vod(void *opaque, uint8_t *buf, int buf_size)
//{
//    //struct buffer_data *bd = (struct buffer_data *)opaque;
//    //buf_size = FFMIN(buf_size, bd->size);
//    SniffHTTPFLVContext *sniffHttpFlvContext = (SniffHTTPFLVContext *)opaque;
//    buf_size = FFMIN(buf_size, sniffHttpFlvContext->m_bd.size);
//
//    if (!buf_size) {
//        //printf("read_stream - bd ptr:%p bd size:%d, buf_size:%d ERROR EOF\n",
//        //sniffHttpFlvContext->m_bd.ptr, sniffHttpFlvContext->m_bd.size, buf_size);
//        return AVERROR_EOF;
//    }
//    //printf("read_stream - ptr:%p consume:%d size:%zu pos:%d total:%d\n",
//    //        m_bd.ptr, buf_size, m_bd.size, m_bd.read_pos, m_bd.total);
//
//    /* copy internal buffer data to buf */
//    //memcpy(buf, m_bd.ptr, buf_size);
//    //printf("read_stream - start memcpy\n");
//    sniffHttpFlvContext->m_bd_temp_ptr = sniffHttpFlvContext->m_bd.ptr + sniffHttpFlvContext->m_bd.read_pos;
//
//    memcpy(buf, sniffHttpFlvContext->m_bd_temp_ptr, buf_size);
//    sniffHttpFlvContext->m_bd.read_pos += buf_size;
//
//    //m_bd.ptr = m_bd.ptr + buf_size;
//    //m_bd_temp_ptr = m_bd.ptr + sniffHttpFlvContextTempPtr->m_bd.read_pos;
//
//    sniffHttpFlvContext->m_bd.size -= buf_size;
//
//    //printf("read_stream - bd ptr:%p bd size:%d, buf_size:%d\n", m_bd.ptr, m_bd.size, buf_size);
//    return buf_size;
//}

/**
 * 实质进行的是读取已有内存的size数据，拷贝到buf中。opaque方便参数传递。注意，在拷贝时要对pos累加。
 * @param opaque
 * @param buf
 * @param buf_size
 * @return
 */
int hflv_read_stream_live(void *opaque, uint8_t *buf, int buf_size)
{
    //struct buffer_data *bd = (struct buffer_data *)opaque;
    //buf_size = FFMIN(buf_size, bd->size);
    SniffHTTPFLVContext *sniffHttpFlvContext = (SniffHTTPFLVContext *)opaque;

    //printf("before read_stream FFMIN - bd ptr:%p size:%zu, buf_size:%d\n",
    //       sniffHttpFlvContext->m_bd.ptr, sniffHttpFlvContext->m_bd.size, buf_size);

    buf_size = FFMIN(buf_size, sniffHttpFlvContext->m_bd.size);

    //printf("after read_stream FFMIN - bd ptr:%p size:%zu, buf_size:%d MIN:%lu\n",
    //       sniffHttpFlvContext->m_bd.ptr,
    //       sniffHttpFlvContext->m_bd.size,
    //       buf_size,
    //       FFMIN(buf_size, sniffHttpFlvContext->m_bd.size));

    if (!buf_size) {
        //printf("read_stream - bd ptr:%p bd size:%zu, buf_size:%d ERROR EOF\n",
        //sniffHttpFlvContext->m_bd.ptr, sniffHttpFlvContext->m_bd.size, buf_size);
        return AVERROR_EOF;
    }
    //printf("read_stream - ptr:%p consume:%d size:%zu pos:%d total:%d\n",
    //        m_bd.ptr, buf_size, m_bd.size, m_bd.read_pos, m_bd.total);

    /* copy internal buffer data to buf */
    //memcpy(buf, m_bd.ptr, buf_size);
    //printf("read_stream - start memcpy\n");
    sniffHttpFlvContext->m_bd_temp_ptr = sniffHttpFlvContext->m_bd.ptr + sniffHttpFlvContext->m_bd.read_pos;

    memcpy(buf, sniffHttpFlvContext->m_bd_temp_ptr, buf_size);
    sniffHttpFlvContext->m_bd.read_pos += buf_size;

    // patch
    int dstLen = sniffHttpFlvContext->m_bd.total - buf_size;
    uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
    int lastBytesLen = removeMallocU8(
            sniffHttpFlvContext->m_bd.ptr,
            sniffHttpFlvContext->m_bd.total,
            dst, buf_size, dstLen);

    free(sniffHttpFlvContext->m_bd.ptr);
    sniffHttpFlvContext->m_bd.ptr = dst;
    sniffHttpFlvContext->m_bd.total = dstLen;
    sniffHttpFlvContext->m_bd.read_pos = 0;
    sniffHttpFlvContext->m_bd_temp_ptr = NULL;

    //m_bd.ptr = m_bd.ptr + buf_size;
    //m_bd_temp_ptr = m_bd.ptr + sniffHttpFlvContextTempPtr->m_bd.read_pos;

    //sniffHttpFlvContext->m_bd.size -= buf_size;
    sniffHttpFlvContext->m_bd.size = dstLen;

    //printf("read_stream - bd ptr:%p bd total_size:%d size:%zu, buf_size:%d, ret:%d\n",
    //        sniffHttpFlvContext->m_bd.ptr,
    //        sniffHttpFlvContext->m_bd.total,
    //        sniffHttpFlvContext->m_bd.size,
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
int hflv_seek_in_buffer(void *opaque, int64_t offset, int whence) {
    return -1;
}

// void *myFlvThread(void *arg) {
//     SniffHTTPFLVContext *sniffHttpFlvContext = (SniffHTTPFLVContext *) arg;
//     EM_ASM(alert("myThread111"));
//     EM_ASM_(
//             {
//                     console.log("myThread111", $0);
//             },
//             222
//     );
//     EM_ASM(
//             postMessage({cmd:"go", data:"myFlvThread go"});
//     );
//     double start_v = sniffHttpFlvContext->m_vStartTime * sniffHttpFlvContext->m_vTimebase;
//     while(1) {
//         int ret = sniffHttpFlvContext->getPacketFunc(sniffHttpFlvContext, 1);
//
//         if (ret == MISSILE_PKT_GET_TYPE_HAVE_VIDEO || ret == MISSILE_PKT_GET_TYPE_YUV || ret == MISSILE_PKT_GET_TYPE_AAC) {
//             EM_ASM_(
//                     {
//                             console.log("myFlvThread nalu", $0);
//                     },
//                     ret
//             );
//
//         } else if (ret == MISSILE_PKT_GET_NOTHING || ret < 0) {
//             // start_v -
//             // double end_diff_check =
//             //         sniffHttpFlvContext->m_mediaInfo.v_duration - sniffHttpFlvContext->m_frameDuration -
//             //         sniffHttpFlvContext->m_decLastPTS;
//             //
//             // printf("debug myFlvThread sniffHttpFlvContext->getPacketFunc %f - %f - %f = %f <= %f\n",
//             //        sniffHttpFlvContext->m_mediaInfo.v_duration,
//             //         // start_v,
//             //        sniffHttpFlvContext->m_frameDuration,
//             //        sniffHttpFlvContext->m_decLastPTS,
//             //        end_diff_check,
//             //        sniffHttpFlvContext->m_frameDuration);
//             // if (end_diff_check <= sniffHttpFlvContext->m_frameDuration) {
//             //     EM_ASM_(
//             //             {
//             //                     console.log("myFlvThread EXIT", $0);
//             //             },
//             //             ret
//             //     );
//             //     EM_ASM_(
//             //             {
//             //                     postMessage(
//             //                             {
//             //                                     cmd: "goexit",
//             //                                     data: {
//             //                                             corePtr: $0
//             //                                     }
//             //                             }
//             //                     );
//             //             },
//             //             sniffHttpFlvContext
//             //     );
//             //     break;
//             // }
//         }
//         // EM_ASM_(
//         //         {
//         //             console.log("myFlvThread nalu", $0);
//         //         },
//         //         ret
//         // );
//         // EM_ASM_(
//         //         {
//         //             postMessage({cmd:"go", data:"myFlvThread go ret:" + $0});
//         //         },
//         //         ret
//         // );
//         // sleep(1);
//     }
//
//     pthread_exit(0);
// } // myFlvThread


void *hflv_decflvthread(void *arg) {
    SniffHTTPFLVContext *sniffHttpFlvContext = (SniffHTTPFLVContext *) arg;
    sniffHttpFlvContext->m_threadRefresh = MISSILE_PTHREAD_ALREADY_CREATE;

    char szError[256] = {0};

    AV_DEC_Nalu_Node *node = NULL;

    while(1) {

        if (sniffHttpFlvContext == NULL || sniffHttpFlvContext->m_threadRefresh == MISSILE_PTHREAD_WAIT_TO_RELEASE) {
            break;
        }
        if (node != NULL) {
            int ret_free_node = AV_DEC_NaluNode_Release(node);
            // printf("nalu LList length 2:%zu ret:%d\n", sniffHttpFlvContext->m_avDecNaluLinkList->length, ret_free_node);
            node = NULL;
        }

        node = AV_DEC_NaluNode_Pop_1st(sniffHttpFlvContext->m_avDecNaluLinkList);
        if (node == NULL) {
            // sleep(1);
            continue;
        } else {
            // int ret_free_node = AV_DEC_NaluNode_Release(node);
            // printf("nalu LList length 2:%zu ret:%d\n", sniffHttpFlvContext->m_avDecNaluLinkList->length, ret_free_node);
        }

        sniffHttpFlvContext->m_decPacket->data = node->buff;
        sniffHttpFlvContext->m_decPacket->size = node->len;
        sniffHttpFlvContext->m_decPacket->pts = node->pts;
        sniffHttpFlvContext->m_decPacket->dts = node->dts;
        sniffHttpFlvContext->m_decPacket->tag = node->tag;
        sniffHttpFlvContext->m_decPacket->skip = node->skip;

        long decodeStartMS = getMillisecondTime();

        char szError[256] = {0};
        int sendRet = avcodec_send_packet(sniffHttpFlvContext->m_vDecCodecContext, sniffHttpFlvContext->m_decPacket);

        if (sendRet != 0) {
            if (sendRet == AVERROR(EAGAIN)) {
                printf("send ===========> need again\n");
                // return MISSILE_PKT_GET_NOTHING;
            } else if (sendRet == AVERROR_EOF) {
                printf("send ===========> eof\n");
                // return MISSILE_PKT_GET_NOTHING;
            } else if (sendRet == AVERROR(EINVAL)) {
                printf("send ===========> inval\n");
                // return MISSILE_PKT_GET_NOTHING;
            } else if (sendRet == AVERROR(ENOMEM)) {
                printf("send ===========> oom\n");
                // return MISSILE_PKT_GET_NOTHING;
            } else {
                //printf("sendRet ===========> %d\n", sendRet);
                av_strerror(sendRet, szError, 256);
                printf("send message ===========> %s\n", szError);
                // return sendRet;
            }
            continue;
        } // sendRet

        int hasYuv = 0;
        if (sendRet == 0) {
            int rec_re = 0;
            while(1) {
                rec_re = avcodec_receive_frame(sniffHttpFlvContext->m_vDecCodecContext, sniffHttpFlvContext->m_frame);
                if (rec_re == 0) {
                    // printf("debug +++++ frame pts:%lld\n", sniffHttpFlvContext->m_frame->pts);
                    if (sniffHttpFlvContext->isSetCallback > 0)
                    {
                        long decodeEndMS = getMillisecondTime();
                        int decodeCostMS = (int) (decodeEndMS - decodeStartMS);

                        // time_t t1 = time(NULL);

                        // printf("debug callbackYUV==============> time:%ld - %ld = %ld\n",
                        //        decodeEndMS, decodeStartMS, decodeCostMS);


                        // printf("use multi thread yuv callback\n");
                        EM_ASM_(
                                {
                                        postMessage(
                                                {
                                                        cmd:"go",
                                                        data: {
                                                                type: "decode_video_flv",
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
                                sniffHttpFlvContext,
                                sniffHttpFlvContext->m_frame->data[0],
                                sniffHttpFlvContext->m_frame->data[1],
                                sniffHttpFlvContext->m_frame->data[2],
                                sniffHttpFlvContext->m_frame->linesize[0],
                                sniffHttpFlvContext->m_frame->linesize[1],
                                sniffHttpFlvContext->m_frame->linesize[2],
                                sniffHttpFlvContext->m_frame->width,
                                sniffHttpFlvContext->m_frame->height,
                                (double) sniffHttpFlvContext->m_frame->pts / 1000.0,
                                decodeCostMS
                        );
                        // printf("use single thread yuv callback\n");
                        // sniffHttpFlvContext->yuvFrameCallback(sniffHttpFlvContext->m_frame->data[0],
                        //                                       sniffHttpFlvContext->m_frame->data[1],
                        //                                       sniffHttpFlvContext->m_frame->data[2],
                        //                                       sniffHttpFlvContext->m_frame->linesize[0],
                        //                                       sniffHttpFlvContext->m_frame->linesize[1],
                        //                                       sniffHttpFlvContext->m_frame->linesize[2],
                        //                                       sniffHttpFlvContext->m_frame->width,
                        //                                       sniffHttpFlvContext->m_frame->height,
                        //                                       (double) sniffHttpFlvContext->m_frame->pts / 1000.0,
                        //                                       decodeCostMS);

                        hasYuv += 1;
                    } // ok
                } else {
                    //printf("rec_re ===========> %d\n", rec_re);
                    break;
                }
            }

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
        //if (frameFinished && sniffHttpFlvContext->isSetCallback > 0) {
        //    sniffHttpFlvContext->yuvFrameCallback(sniffHttpFlvContext->m_frame->data[0],
        //                                         sniffHttpFlvContext->m_frame->data[1],
        //                                         sniffHttpFlvContext->m_frame->data[2],
        //                                         sniffHttpFlvContext->m_frame->linesize[0],
        //                                         sniffHttpFlvContext->m_frame->linesize[1],
        //                                         sniffHttpFlvContext->m_frame->linesize[2],
        //                                         sniffHttpFlvContext->m_mediaInfo.width,
        //                                         sniffHttpFlvContext->m_mediaInfo.height,
        //                                         (double) sniffHttpFlvContext->m_frame->pts / 1000.0);
        //    return MISSILE_PKT_GET_TYPE_YUV;
        //} // ok

        //if (NULL != sniffHttpFlvContext->m_pktNodeHead) {
        //    if (sniffHttpFlvContext->m_pktNodePlayPtr == NULL) {
        //        sniffHttpFlvContext->m_pktNodePlayPtr = sniffHttpFlvContext->m_pktNodeHead;
        //    }
        //
        //    sniffHttpFlvContext->m_pktNodePlayPtr = sniffHttpFlvContext->m_pktNodePlayPtr;
        //
        //    AVPacket *pkt = sniffHttpFlvContext->m_pktNodePlayPtr->avPacket;
        //
        //    // do
        //    // @TODO
        //    int frameFinished = 0;
        //    // 解码
        //    int recvRet = avcodec_decode_video2(
        //            sniffHttpFlvContext->m_vCodecContext, sniffHttpFlvContext->m_frame, &frameFinished, pkt);
        //    //int recvRet = avcodec_receive_frame(sniffHttpFlvContext->m_vCodecContext, sniffHttpFlvContext->m_frame);
        //    //printf("recvRet ===========> %d\n", recvRet);
        //
        //    //double vTime = pkt->pts * sniffHttpFlvContext->m_vTimebase;
        //
        //    if (frameFinished && sniffHttpFlvContext->isSetCallback > 0) {
        //    //if (recvRet >= 0 && sniffHttpFlvContext->isSetCallback > 0) {
        //        sniffHttpFlvContext->yuvFrameCallback(sniffHttpFlvContext->m_frame->data[0],
        //                                             sniffHttpFlvContext->m_frame->data[1],
        //                                             sniffHttpFlvContext->m_frame->data[2],
        //                                             sniffHttpFlvContext->m_frame->linesize[0],
        //                                             sniffHttpFlvContext->m_frame->linesize[1],
        //                                             sniffHttpFlvContext->m_frame->linesize[2],
        //                                             sniffHttpFlvContext->m_mediaInfo.width,
        //                                             sniffHttpFlvContext->m_mediaInfo.height,
        //                                             sniffHttpFlvContext->m_frame->pts * sniffHttpFlvContext->m_vTimebase);
        //    } // ok
        //
        //    // next frame
        //    sniffHttpFlvContext->m_pktNodePlayPtr = sniffHttpFlvContext->m_pktNodePlayPtr->next;
        //    return MISSILE_PKT_GET_TYPE_YUV;
        //}
*/
        // return MISSILE_PKT_GET_NOTHING;
    } // end while thread

} // hflv_decflvthread

/**
 *
 ************************************** @public functions
 ************************************** @member
 *
 */
//void introduceMineFunc() {
//    introduce_mine();
//}

/**
 *
 * @param sniffHttpFlvContext
 * @param isRelease 0 no 1 yes
 * @return
 */
int hflv_resetMembers(SniffHTTPFLVContext *sniffHttpFlvContext, MISSILE_CMD_IS_RELEASE_TYPE isRelease) {
    printf("reset members with tag : %d\n", isRelease);
    // 防御性
    if (sniffHttpFlvContext == NULL) {
        return -1;
    }
    int ret = 0;

    sniffHttpFlvContext->m_mode              = MISSILE_SNIFFSTREAM_MODE_VOD;

    sniffHttpFlvContext->m_probe             = 0;
    sniffHttpFlvContext->isSetCallback       = 0;
    // set callback
    sniffHttpFlvContext->probeCallback       = NULL;
    sniffHttpFlvContext->yuvFrameCallback    = NULL;
    sniffHttpFlvContext->naluFrameCallback   = NULL;
    sniffHttpFlvContext->pcmSamplesCallback  = NULL;
    sniffHttpFlvContext->aacSamplesCallback  = NULL;

    // threads start
    {
        if (sniffHttpFlvContext->m_threadRefresh == MISSILE_PTHREAD_ALREADY_CREATE &&
            isRelease == MISSILE_CMD_IS_RELEASE_YES)
        {
            sniffHttpFlvContext->m_threadRefresh = MISSILE_PTHREAD_WAIT_TO_RELEASE;
            pthread_join(sniffHttpFlvContext->m_decThread_0, NULL);
        }
        sniffHttpFlvContext->m_threadRefresh = MISSILE_PTHREAD_WAIT_TO_CREATE;
    }
    // threads end

    //if (NULL != sniffHttpFlvContext->m_pktNodeHead && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    sniffHttpFlvContext->m_pktNodePtr = sniffHttpFlvContext->m_pktNodeHead;
    //
    //    AVPktNode *tmpNode = NULL;
    //    while (NULL != sniffHttpFlvContext->m_pktNodePtr) {
    //        av_packet_unref(sniffHttpFlvContext->m_pktNodePtr->avPacket);
    //        sniffHttpFlvContext->m_pktNodePtr->avPacket = NULL;
    //
    //        tmpNode = sniffHttpFlvContext->m_pktNodePtr;
    //        sniffHttpFlvContext->m_pktNodePtr = sniffHttpFlvContext->m_pktNodePtr->next;
    //
    //        free(tmpNode);
    //        tmpNode = NULL;
    //    }
    //}
    //sniffHttpFlvContext->m_pktNodePtr        = NULL;
    //sniffHttpFlvContext->m_pktNodePlayPtr    = NULL;
    //sniffHttpFlvContext->m_pktNodeHead       = NULL;

    //printf("START Release v frame\n");
    if (NULL != sniffHttpFlvContext->m_frame && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_frame_free(&sniffHttpFlvContext->m_frame);
    }
    sniffHttpFlvContext->m_frame = NULL;
    //printf("END Release v frame\n");

    //if (NULL != sniffHttpFlvContext->m_absFilter && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
    //    av_bitstream_filter_close(sniffHttpFlvContext->m_absFilter);
    //}
    if (NULL != sniffHttpFlvContext->m_absCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_bsf_free(&sniffHttpFlvContext->m_absCtx);
    }
    sniffHttpFlvContext->m_absCtx = NULL;
    sniffHttpFlvContext->m_absFilter = NULL;



    //printf("Release a frame start\n");
    //if (NULL != sniffHttpFlvContext->m_aFrame) {
    //    av_frame_free(&sniffHttpFlvContext->m_aFrame);
    //}
    //sniffHttpFlvContext->m_aFrame = NULL;
    //printf("Release a frame finished\n");

    //printf("START Release vcodecCtx\n");
    if (NULL != sniffHttpFlvContext->m_vCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffHttpFlvContext->m_vCodecContext);
    }
    sniffHttpFlvContext->m_vCodecContext = NULL;
    //printf("END Release vcodecCtx\n");

    if (NULL != sniffHttpFlvContext->m_vDecCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffHttpFlvContext->m_vDecCodecContext);
    }
    sniffHttpFlvContext->m_vDecCodecContext = NULL;
    sniffHttpFlvContext->m_vDecCodec = NULL;

    //printf("START Release acodecCtx start\n");
    if (NULL != sniffHttpFlvContext->m_aCodecContext && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        ret = avcodec_close(sniffHttpFlvContext->m_aCodecContext);
    }
    sniffHttpFlvContext->m_aCodecContext = NULL;
    //printf("END Release acodecCtx\n");

    if (NULL != sniffHttpFlvContext->m_decPacket && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        av_packet_unref(sniffHttpFlvContext->m_decPacket);
    }
    sniffHttpFlvContext->m_decPacket = NULL;

    if (NULL != sniffHttpFlvContext->m_naluInfo && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        if (NULL != sniffHttpFlvContext->m_naluInfo->vps) {
            free(sniffHttpFlvContext->m_naluInfo->vps);
            sniffHttpFlvContext->m_naluInfo->vps     = NULL;
            sniffHttpFlvContext->m_naluInfo->vpsLen  = 0;
        }
        if (NULL != sniffHttpFlvContext->m_naluInfo->sps) {
            free(sniffHttpFlvContext->m_naluInfo->sps);
            sniffHttpFlvContext->m_naluInfo->sps     = NULL;
            sniffHttpFlvContext->m_naluInfo->spsLen  = 0;
        }
        if (NULL != sniffHttpFlvContext->m_naluInfo->pps) {
            free(sniffHttpFlvContext->m_naluInfo->pps);
            sniffHttpFlvContext->m_naluInfo->pps     = NULL;
            sniffHttpFlvContext->m_naluInfo->ppsLen  = 0;
        }
        if (NULL != sniffHttpFlvContext->m_naluInfo->sei) {
            free(sniffHttpFlvContext->m_naluInfo->sei);
            sniffHttpFlvContext->m_naluInfo->sei     = NULL;
            sniffHttpFlvContext->m_naluInfo->seiLen  = 0;
        }
        free(sniffHttpFlvContext->m_naluInfo);
        sniffHttpFlvContext->m_naluInfo->naluLen = 0;
    }
    sniffHttpFlvContext->m_naluInfo = NULL;


    //sniffHttpFlvContext->m_sampleBuf         = NULL;
    //sniffHttpFlvContext->m_swrCtx            = NULL;
    sniffHttpFlvContext->m_needSwr           = 0;

    // Outside MediaInfo
    sniffHttpFlvContext->m_mediaInfo.fps             = -1;
    sniffHttpFlvContext->m_mediaInfo.gop             = 0;
    sniffHttpFlvContext->m_mediaInfo.a_duration      = -1;
    sniffHttpFlvContext->m_mediaInfo.v_duration      = -1;
    sniffHttpFlvContext->m_mediaInfo.duration        = -1;

    sniffHttpFlvContext->m_mediaInfo.a_sample_rate   = 0;
    sniffHttpFlvContext->m_mediaInfo.a_channel       = 0;
    sniffHttpFlvContext->m_mediaInfo.a_sample_fmt    = NULL;
    sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate = 0;
    sniffHttpFlvContext->m_mediaInfo.a_out_channel     = 0;
    sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt  = NULL;
    sniffHttpFlvContext->m_mediaInfo.a_profile       = 2; // LC

    sniffHttpFlvContext->m_mediaInfo.width           = 0;
    sniffHttpFlvContext->m_mediaInfo.height          = 0;

    sniffHttpFlvContext->m_vTimebase         = -1;
    sniffHttpFlvContext->m_aTimebase         = -1;
    sniffHttpFlvContext->m_vStartTime        = -1;
    sniffHttpFlvContext->m_aStartTime        = -1;
    sniffHttpFlvContext->m_videoIndex        = -1;
    sniffHttpFlvContext->m_audioIndex        = -1;
    sniffHttpFlvContext->m_vCodec            = V_CODEC_NAME_UNKN;
    sniffHttpFlvContext->m_aCodec            = A_CODEC_NAME_UNKN;
    // sniffHttpFlvContext->m_fps               = -1;
    sniffHttpFlvContext->m_gop               = -1;

    //sniffHttpFlvContext->m_buf               = NULL;
    //sniffHttpFlvContext->m_bufLen            = 0;

    sniffHttpFlvContext->m_ignoreAudio       = 0;

    //m_bd = {0};
    sniffHttpFlvContext->m_bd.ptr = NULL;
    sniffHttpFlvContext->m_bd.size = 0;
    sniffHttpFlvContext->m_bd.total = 0;
    sniffHttpFlvContext->m_bd.read_pos = 0;
    sniffHttpFlvContext->m_bd_temp_ptr = NULL;

    //printf("START Release m_formatCtx\n");
    if (NULL != sniffHttpFlvContext->m_formatCtx && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
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
        avformat_close_input(&sniffHttpFlvContext->m_formatCtx);
    }
    sniffHttpFlvContext->m_formatCtx = NULL;
    //printf("END Release m_formatCtx\n");

    sniffHttpFlvContext->m_piFmt             = NULL;
    sniffHttpFlvContext->m_avPacket          = NULL;
    sniffHttpFlvContext->m_pb                = NULL;

    // NALU LINK_LIST
    if (sniffHttpFlvContext->m_avDecNaluLinkList != NULL && isRelease == MISSILE_CMD_IS_RELEASE_YES) {
        int ret_relese_nalu = AV_DEC_NaluLinkList_Release(sniffHttpFlvContext->m_avDecNaluLinkList);
        if (ret_relese_nalu < 0) {
            printf("reset members with tag : %d, when release nalu LList get error code:%d\n", isRelease, ret_relese_nalu);
        }
    }
    sniffHttpFlvContext->m_avDecNaluLinkList = NULL;

    //printf("START Release m_missileAvYuvFrame\n");
    //cleanAvYuvFrame(sniffHttpFlvContext, isRelease);
    //printf("END Release m_missileAvYuvFrame\n");

    return ret;
}

int hflv_initFunc(SniffHTTPFLVContext *sniffHttpFlvContext, MISSILE_SNIFFSTREAM_MODE mode) {
    if (sniffHttpFlvContext == NULL) {
        return -1;
    }
    sniffHttpFlvContext->introduceMineFunc();

    sniffHttpFlvContext->m_mode = mode;

    //av_register_all();
    //avcodec_register_all();

    int ret = hflv_resetMembers(sniffHttpFlvContext, MISSILE_CMD_IS_RELEASE_NO);
    printf("VideoMissile http-media-module init done %d\n", ret);

    // @TODO
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
    sniffHttpFlvContext->m_avDecNaluLinkList = AV_DEC_NaluLinkList_Create_By_Idx(0);
    if (sniffHttpFlvContext->m_avDecNaluLinkList == NULL) {
        printf("init open video nalu LList failed\n");
        return -5;
    }

    return ret;
}

int hflv_releaseFunc(SniffHTTPFLVContext *sniffHttpFlvContext) {
    int ret = hflv_resetMembers(sniffHttpFlvContext, MISSILE_CMD_IS_RELEASE_YES);
    printf("VideoMissile http-media-module release done %d\n", ret);
    return ret;
}

int hflv_pushBufferFunc(
        SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buf, int buf_size, int probe_size) {
    if (buf_size < 0 || buf == NULL) {
        return 0;
    }
    // set point
    // copy to mem
    //printf("==========================================================================memcpy start\n");
    //printf("probe size: %d\n", probe_size);

    if (sniffHttpFlvContext != NULL) {
        if (sniffHttpFlvContext->m_bd.ptr == NULL
            || sniffHttpFlvContext->m_bd.size <= 0) {

            sniffHttpFlvContext->m_bd.ptr = (uint8_t *) malloc(sizeof(uint8_t) * buf_size);
            sniffHttpFlvContext->m_bd.size = buf_size;
            memcpy(sniffHttpFlvContext->m_bd.ptr, buf, buf_size);
            //printf(">>>  memcpy done\n");
        } else {
            // remalloc
            //printf("start re malloc data %d\n", m_bd.size);
            uint8_t *dst = reMallocU8(
                    sniffHttpFlvContext->m_bd.ptr, sniffHttpFlvContext->m_bd.total, buf, buf_size);

            //printf("start re malloc free %p %d %d %d step %d %d\n",
            //       m_bd.ptr, m_bd.ptr[0], m_bd.ptr[1], m_bd.ptr[2], m_bd.ptr == NULL, m_bd.size);

            if (sniffHttpFlvContext->m_bd.ptr != NULL) {
                free(sniffHttpFlvContext->m_bd.ptr);
                sniffHttpFlvContext->m_bd.ptr = NULL;
            }

            sniffHttpFlvContext->m_bd.ptr = dst;
            sniffHttpFlvContext->m_bd.size += buf_size;
            //printf("end re malloc done + %d = %d\n", buf_size, m_bd.size);
        }
    } else {
        return -1;
    }
    sniffHttpFlvContext->m_bd.total += buf_size;
    //printf("========> bd total: %d\n", sniffHttpFlvContext->m_bd.total);

    int avRet = 0;
    // init
    if (sniffHttpFlvContext != NULL && sniffHttpFlvContext->m_piFmt == NULL) {
        sniffHttpFlvContext->m_frame = av_frame_alloc();
        //sniffHttpFlvContext->m_aFrame = av_frame_alloc();
        //if (!sniffHttpFlvContext->m_frame || !sniffHttpFlvContext->m_aFrame) {
        if (!sniffHttpFlvContext->m_frame) {
            printf("av_frame_alloc-frame 初始化解码器失败\n");
            return -1;
        }

        uint8_t *bufPb = (uint8_t *)malloc(sizeof(uint8_t) * HFLV_BUF_SIZE);
        // run read_stream
        //sniffHttpFlvContext->m_pb = avio_alloc_context(
        //        bufPb, HFLV_BUF_SIZE, 0, &m_bd, read_stream, NULL, NULL);
        //if (sniffHttpFlvContext->m_mode == MISSILE_SNIFFSTREAM_MODE_LIVE) {
        sniffHttpFlvContext->m_pb = avio_alloc_context(
                bufPb, HFLV_BUF_SIZE, 0, sniffHttpFlvContext, hflv_read_stream_live, NULL, NULL);
        //} else {
        //sniffHttpFlvContext->m_pb = avio_alloc_context(
        //bufPb, HFLV_BUF_SIZE, 0, sniffHttpFlvContext, read_stream_vod, NULL, NULL);
        //}

        avRet = av_probe_input_buffer(
                sniffHttpFlvContext->m_pb, &sniffHttpFlvContext->m_piFmt, "", NULL, 0, 4096);
        if (avRet < 0) {
            printf("probe format failed msg: %s, set default format to [FLV]\n", 
                getCodeMsg(avRet));
            sniffHttpFlvContext->m_piFmt = av_find_input_format("flv"); // default is flv
            //return -1;
        } else {
            printf("format:%s[%s]\n", sniffHttpFlvContext->m_piFmt->name,
                   sniffHttpFlvContext->m_piFmt->long_name);
        }

        sniffHttpFlvContext->m_formatCtx = avformat_alloc_context();
        sniffHttpFlvContext->m_formatCtx->pb = sniffHttpFlvContext->m_pb;
        sniffHttpFlvContext->m_formatCtx->flags = AVFMT_FLAG_CUSTOM_IO;

        //sniffHttpFlvContext->m_avPacket = (AVPacket *)av_malloc(sizeof(AVPacket));
        sniffHttpFlvContext->m_avPacket = av_packet_alloc();
        av_init_packet(sniffHttpFlvContext->m_avPacket);
    }

    if (sniffHttpFlvContext->m_probe < 1 && sniffHttpFlvContext->m_bd.total >= probe_size) {

        // >= PROBE_SIZE
        //printf("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv\n");
        AVDictionary* options = NULL;
        av_dict_set(&options, "buffer_size", "409600", 0); //设置缓存大小，1080p可将值调大
        avRet = avformat_open_input(
                &sniffHttpFlvContext->m_formatCtx, "", sniffHttpFlvContext->m_piFmt, &options);
        //avRet = avformat_open_input(
        //        &sniffHttpFlvContext->m_formatCtx, "", NULL, NULL);
        if (avRet != 0) {
            //iformat，priv_data赋值，pb, nbstreams,streams为null
            printf("Couldn't open input stream.（无法打开输入流）: %d, %s\n", avRet, getCodeMsg(avRet));
            return -2;
        }

        avRet = avformat_find_stream_info(sniffHttpFlvContext->m_formatCtx, NULL);
        if (avRet < 0) {
            printf("Couldn't find stream information.（无法获取流信息）: %d %s\n", avRet, getCodeMsg(avRet));
            return -3;
        }

        sniffHttpFlvContext->m_videoIndex = -1;
        int find = 0;
        int trans_to_gcore = 0;
        for (int i = 0; i < sniffHttpFlvContext->m_formatCtx->nb_streams; i++) {
            AVStream *contex_stream = sniffHttpFlvContext->m_formatCtx->streams[i];
            enum AVCodecID codecId = contex_stream->codecpar->codec_id;

            if (contex_stream->codec->codec_type == AVMEDIA_TYPE_VIDEO) {
                sniffHttpFlvContext->m_videoIndex = i;
                find += 1;

                if (codecId == AV_CODEC_ID_H265 || codecId == AV_CODEC_ID_HEVC) {
                    sniffHttpFlvContext->m_vCodec = V_CODEC_NAME_HEVC;
                } else if (codecId == AV_CODEC_ID_H264) {
                    sniffHttpFlvContext->m_vCodec = V_CODEC_NAME_AVC;
                }

                //if (sniffHttpFlvContext->isSetCallback > 0) {
                //    sniffHttpFlvContext->probeCallback(
                //            sniffHttpFlvContext->m_mediaInfo.duration,
                //            sniffHttpFlvContext->m_mediaInfo.width,
                //            sniffHttpFlvContext->m_mediaInfo.height,
                //            sniffHttpFlvContext->m_mediaInfo.fps,
                //            sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate,
                //            sniffHttpFlvContext->m_mediaInfo.a_out_channel,
                //            sniffHttpFlvContext->m_vCodec,
                //            sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt);
                //}

                sniffHttpFlvContext->m_mediaInfo.width = contex_stream->codec->width;
                sniffHttpFlvContext->m_mediaInfo.height = contex_stream->codec->height;
                sniffHttpFlvContext->m_vTimebase = av_q2d(contex_stream->time_base);

                /*
                 * Decoder
                 */
                AVCodec *dec = avcodec_find_decoder(codecId);
                const char* codec_name = avcodec_get_name(codecId);
                printf("video codec name:%s\n", codec_name);
                //const char* codecName = avcodec_get_name(codecId);
                //const char *codec_name = avcodec_get_name(sniffHttpFlvContext->m_vCodecContext->codec_id);
                if (!dec) {
                    printf("Failed to find decoder video for stream #%u codec:%s\n", i, codec_name);
                    //return AVERROR_DECODER_NOT_FOUND;
                } else {

                    // hard copy video codec name
                    //sniffHttpFlvContext->m_vCodec = (char *) malloc(sizeof(codec_name));
                    //strcpy(sniffHttpFlvContext->m_vCodec, codec_name);

                    sniffHttpFlvContext->m_vCodecContext = avcodec_alloc_context3(dec);
                    if (!sniffHttpFlvContext->m_vCodecContext) {
                        printf("Failed to allocate the video decoder context for stream #%u\n", i);
                        return AVERROR(ENOMEM);
                    }
                    avRet = avcodec_parameters_to_context(
                            sniffHttpFlvContext->m_vCodecContext, contex_stream->codecpar);
                    if (avRet < 0) {
                        printf("Failed to copy video decoder parameters to input decoder context "
                               "for stream #%u\n", i);
                        return avRet;
                    }

                    //const char *codec_name = avcodec_get_name(sniffHttpFlvContext->m_vCodecContext->codec_id);
                    printf("video codec name:%s\n", codec_name);
                    if (avcodec_open2(
                            sniffHttpFlvContext->m_vCodecContext, dec, 0) < 0) {
                        printf("avcodec_open2 初始化解码器失败\n");
                        return -1;
                    }


                    if (contex_stream->duration < 0) {
                        //printf("debug contex_stream->duration < 0\n");
                        sniffHttpFlvContext->m_mediaInfo.v_duration =
                                sniffHttpFlvContext->m_formatCtx->duration / (double) AV_TIME_BASE;
                    } else {
                        //printf("debug contex_stream->duration >= 0\n");
                        sniffHttpFlvContext->m_mediaInfo.v_duration =
                                contex_stream->duration * sniffHttpFlvContext->m_vTimebase;
                    }

                    sniffHttpFlvContext->m_mediaInfo.duration =
                            sniffHttpFlvContext->m_mediaInfo.v_duration;
                    sniffHttpFlvContext->m_mediaInfo.fps = av_q2d(contex_stream->r_frame_rate);

                    //printf("debug video duration param: \n"
                    //       "d:%lld,tb:%f, \n"
                    //       "d:%lld,tb:%d, \n"
                    //       "duration %f\n"
                    //       "duration %f\n",
                    //       contex_stream->duration, sniffHttpFlvContext->m_vTimebase,
                    //       sniffHttpFlvContext->m_formatCtx->duration, AV_TIME_BASE,
                    //       contex_stream->duration * sniffHttpFlvContext->m_vTimebase,
                    //       sniffHttpFlvContext->m_formatCtx->duration / (double)AV_TIME_BASE);
                } // end find decoder
            } // end AVMEDIA_TYPE_VIDEO

            if (contex_stream->codec->codec_type == AVMEDIA_TYPE_AUDIO && sniffHttpFlvContext->m_ignoreAudio == 0) {
                sniffHttpFlvContext->m_audioIndex = i;
                find += 1;
                sniffHttpFlvContext->m_aTimebase = av_q2d(contex_stream->time_base);

                //sniffHttpFlvContext->m_formatCtx->
                //printf("debug audio sample rate: %d\n", contex_stream->codecpar->sample_rate);
                //printf("debug audio sample channels: %d\n", contex_stream->codecpar->channels);
                //printf("debug audio sample profile: %d\n", sniffHttpFlvContext->);
                //printf("debug audio sample duration: %f\n", contex_stream->duration * sniffHttpFlvContext->m_aTimebase);

                //enum AVSampleFormat sampleFormat = contex_stream->codec->sample_fmt;
                //const char *sample_fmt = av_get_sample_fmt_name(sampleFormat);
                //sniffHttpFlvContext->m_mediaInfo.a_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                //strcpy(sniffHttpFlvContext->m_mediaInfo.a_sample_fmt, sample_fmt);
                //
                //printf("debug audio sample fmt: %s\n", sniffHttpFlvContext->m_mediaInfo.a_sample_fmt);
                //
                //sniffHttpFlvContext->m_mediaInfo.a_sample_rate   = contex_stream->codecpar->sample_rate;
                //sniffHttpFlvContext->m_mediaInfo.a_channel       = contex_stream->codecpar->channels;
                //sniffHttpFlvContext->m_mediaInfo.a_profile       = contex_stream->codec->profile;

                // audio
                AVCodec *dec = avcodec_find_decoder(codecId);
                const char* codecName = avcodec_get_name(codecId);
                if (!dec) {
                    printf("Failed to find audio decoder for stream #%u codec:%s\n", i, codecName);
                    return AVERROR_DECODER_NOT_FOUND;
                }
                sniffHttpFlvContext->m_aCodecContext = avcodec_alloc_context3(dec);
                if (!sniffHttpFlvContext->m_aCodecContext) {
                    printf("Failed to allocate the audio decoder context for stream #%u\n", i);
                    return AVERROR(ENOMEM);
                }
                avRet = avcodec_parameters_to_context(
                        sniffHttpFlvContext->m_aCodecContext, contex_stream->codecpar);
                if (avRet < 0) {
                    printf("Failed to copy audio decoder parameters to input decoder context "
                           "for stream #%u\n", i);
                    return avRet;
                }

                const char *codec_name = avcodec_get_name(sniffHttpFlvContext->m_aCodecContext->codec_id);
                printf("audio codec name:%s\n", codec_name);

                if (sniffHttpFlvContext->m_aCodecContext->codec_id != AV_CODEC_ID_AAC) {
                    printf("audio codec:%s is can not play with encode audio frame, trans to g-core\n", codec_name);
                    trans_to_gcore = 1;
                }

                if (avcodec_open2(
                        sniffHttpFlvContext->m_aCodecContext, dec, NULL) < 0) {
                    printf("init decoder failed\n");
                    return -1;
                }

                // media sample format
                enum AVSampleFormat sampleFormat = sniffHttpFlvContext->m_aCodecContext->sample_fmt;
                const char *sample_fmt = av_get_sample_fmt_name(sampleFormat);
                sniffHttpFlvContext->m_mediaInfo.a_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                strcpy(sniffHttpFlvContext->m_mediaInfo.a_sample_fmt, sample_fmt);

                // sample rate channel info
                sniffHttpFlvContext->m_mediaInfo.a_sample_rate   = sniffHttpFlvContext->m_aCodecContext->sample_rate;
                sniffHttpFlvContext->m_mediaInfo.a_channel       = sniffHttpFlvContext->m_aCodecContext->channels;
                sniffHttpFlvContext->m_mediaInfo.a_profile       = sniffHttpFlvContext->m_aCodecContext->profile;

                if (sampleFormat == AV_SAMPLE_FMT_FLTP) {
                    sniffHttpFlvContext->m_needSwr = 0;
                    sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt = (char *) malloc(sizeof(sample_fmt));
                    strcpy(sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt, sample_fmt);

                    // out sample rate channel info
                    sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate   = sniffHttpFlvContext->m_aCodecContext->sample_rate;
                    sniffHttpFlvContext->m_mediaInfo.a_out_channel       = sniffHttpFlvContext->m_aCodecContext->channels;

                } else {
                    sniffHttpFlvContext->m_needSwr = 1;
                    // out sample format
                    const char *sample_out_fmt = av_get_sample_fmt_name(HFLV_OUT_SAMPLE_FMT);
                    sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt = (char *) malloc(sizeof(sample_out_fmt));
                    strcpy(sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt, sample_out_fmt);

                    // out sample rate channel info
                    sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate   = HFLV_OUT_SAMPLE_RATE;
                    sniffHttpFlvContext->m_mediaInfo.a_out_channel       = HFLV_OUT_CHANNEL_NB;

                    //sniffHttpFlvContext->m_swrCtx = swr_alloc();                     //音频重采样上下文
                    //swr_alloc_set_opts(
                    //        sniffHttpFlvContext->m_swrCtx,
                    //        sniffHttpFlvContext->m_mediaInfo.a_out_channel,
                    //        OUT_SAMPLE_FMT,
                    //        sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate,
                    //        sniffHttpFlvContext->m_aCodecContext->channel_layout,
                    //        sniffHttpFlvContext->m_aCodecContext->sample_fmt,
                    //        sniffHttpFlvContext->m_aCodecContext->sample_rate, 0, NULL);
                    //swr_init(sniffHttpFlvContext->m_swrCtx);
                }

                // duration
                if (contex_stream->duration < 0) {
                    sniffHttpFlvContext->m_mediaInfo.a_duration = sniffHttpFlvContext->m_mediaInfo.v_duration;
                } else {
                    sniffHttpFlvContext->m_mediaInfo.a_duration =
                            contex_stream->duration * sniffHttpFlvContext->m_aTimebase;
                }

                //printf("debug audio duration param: \nd:%lld,tb:%f, \nduration %f\n",
                //       contex_stream->duration, sniffHttpFlvContext->m_vTimebase,
                //       contex_stream->duration * sniffHttpFlvContext->m_vTimebase);
            }

            if (find >= 2 || (sniffHttpFlvContext->m_ignoreAudio == 1 && find >= 1)) {
                sniffHttpFlvContext->m_mediaInfo.duration =
                        MIN(sniffHttpFlvContext->m_mediaInfo.v_duration, sniffHttpFlvContext->m_mediaInfo.a_duration);
                av_dump_format(sniffHttpFlvContext->m_formatCtx, 0, "", 0);
                break;
            }
        }

        if (sniffHttpFlvContext->m_videoIndex == -1) {
            printf("Didn't find a video stream.\n");
            return -4;
        } else {
            printf("find video audio stream information %d %d\n",
                   sniffHttpFlvContext->m_videoIndex, sniffHttpFlvContext->m_audioIndex);
        }

        /*
         * nalu bsf
         */
        sniffHttpFlvContext->m_decPacket = av_packet_alloc();
        av_init_packet(sniffHttpFlvContext->m_decPacket);
        if (!sniffHttpFlvContext->m_decPacket) {
            printf("init decoder's pkg unit failed\n");
            return -1;
        }

        // avcodec_find_decoder(AV_CODEC_ID_HEVC)
        sniffHttpFlvContext->m_vDecCodec = avcodec_find_decoder(AV_CODEC_ID_HEVC);
        sniffHttpFlvContext->m_vDecCodecContext = avcodec_alloc_context3(sniffHttpFlvContext->m_vDecCodec);
        if (avcodec_open2(sniffHttpFlvContext->m_vDecCodecContext, sniffHttpFlvContext->m_vDecCodec, NULL) < 0) {
            printf("init decoder's dec-codec unit failed\n");
            return -1;
        }

        sniffHttpFlvContext->m_vDecCodecContext->thread_count = MISSILE_DEC_THREAD_COUNT;
        sniffHttpFlvContext->m_vDecCodecContext->thread_type = FF_THREAD_FRAME;
        sniffHttpFlvContext->m_vDecCodecContext->flags |= AV_CODEC_FLAG_TRUNCATED;

        // mp4 to hevc nalu filter
        sniffHttpFlvContext->m_absFilter = NULL;
        sniffHttpFlvContext->m_absCtx = NULL;
        // /*
        sniffHttpFlvContext->m_absFilter = (AVBitStreamFilter *)av_bsf_get_by_name("hevc_mp4toannexb");
        //过滤器分配内存
        av_bsf_alloc(sniffHttpFlvContext->m_absFilter, &sniffHttpFlvContext->m_absCtx);

        avcodec_parameters_copy(
                sniffHttpFlvContext->m_absCtx->par_in,
                sniffHttpFlvContext->m_formatCtx->streams[sniffHttpFlvContext->m_videoIndex]->codecpar);
        av_bsf_init(sniffHttpFlvContext->m_absCtx);
        // */

        /*
         * Probe Callback
         * sniffHttpFlvContext->m_mediaInfo
         */
        if (sniffHttpFlvContext->isSetCallback > 0) {
            printf("native------------------> probeCallback\n");
            sniffHttpFlvContext->probeCallback(
                    sniffHttpFlvContext->m_mediaInfo.duration,
                    sniffHttpFlvContext->m_mediaInfo.width,
                    sniffHttpFlvContext->m_mediaInfo.height,
                    sniffHttpFlvContext->m_mediaInfo.fps,
                    sniffHttpFlvContext->m_audioIndex,
                    sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate,
                    sniffHttpFlvContext->m_mediaInfo.a_out_channel,
                    sniffHttpFlvContext->m_vCodec,
                    sniffHttpFlvContext->m_mediaInfo.a_out_sample_fmt,
                    trans_to_gcore);
        }

        sniffHttpFlvContext->m_probe = 1;
        printf("native------------------> probe ret : %d\n", sniffHttpFlvContext->m_probe);
#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)
        printf("native------------------> create thread\n");
        pthread_create(&sniffHttpFlvContext->m_decThread_0, NULL, hflv_decflvthread, sniffHttpFlvContext);
#endif

        return 1;
    }

    //sniffHttpFlvContext->getPacketFunc(sniffHttpFlvContext, 1);
    return 0;
}

int hflv_naluLListLengthFunc(SniffHTTPFLVContext *sniffHttpFlvContext) {
    if (sniffHttpFlvContext == NULL) {
        return -1;
    }

    if (sniffHttpFlvContext->m_avDecNaluLinkList == NULL) {
        return -1;
    }

    return sniffHttpFlvContext->m_avDecNaluLinkList->length;
} // naluLListLengthFunc

/**
 * setCodecTypeFunc
 * @param sniffHttpFlvContext
 * @param callback
 * @return
 */
int hflv_setSniffStreamCodecTypeFunc(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        long probeCallback, long yuvCallback, long naluCallback, long pcmCallback, long aacCallback,
        int ignoreAudio)
{
    sniffHttpFlvContext->probeCallback = (HTTPFLV_ProbeCallback) probeCallback;
    sniffHttpFlvContext->yuvFrameCallback = (HTTPFLV_YUVFrameCallback) yuvCallback;
    sniffHttpFlvContext->naluFrameCallback = (HTTPFLV_NaluFrameCallback) naluCallback;
    sniffHttpFlvContext->pcmSamplesCallback = (HTTPFLV_PCMSamplesCallback) pcmCallback;
    sniffHttpFlvContext->aacSamplesCallback = (HTTPFLV_AACSamplesCallback) aacCallback;

    sniffHttpFlvContext->isSetCallback = 1;
    sniffHttpFlvContext->m_ignoreAudio = ignoreAudio;
    return 0;
}

int hflv_getBufferLength(SniffHTTPFLVContext *sniffHttpFlvContext) {
    return sniffHttpFlvContext->m_bd.size;
}

/**
 * Decoder
 * @param sniffHttpFlvContext
 * @param checkProbe 0 NO 1 YES
 * @return
 */
int hflv_getPacketFunc(SniffHTTPFLVContext *sniffHttpFlvContext, int checkProbe) {
    if (sniffHttpFlvContext->m_formatCtx == NULL) {
        printf("read http live pkg error: format context param null\n");
        return -2;
    }

    if (sniffHttpFlvContext->m_avPacket == NULL) {
        printf("read http live pkg error: packet param null\n");
        return -3;
    }

    if (checkProbe > 0 && sniffHttpFlvContext->m_probe < 1) {
        printf("read http live pkg error: probe param null: %d\n", sniffHttpFlvContext->m_probe);
        return -4;
    }

    //printf("debug start getPacketFunc\n");

    int ret_rframe = av_read_frame(sniffHttpFlvContext->m_formatCtx, sniffHttpFlvContext->m_avPacket);
    if (ret_rframe != 0) {
        char szError[256] = {0};
        av_strerror(ret_rframe, szError, 256);
        //printf("debug read http live pkg error: %d, %d, %s\n", ret_rframe, AVERROR_EOF, getCodeMsg(ret_rframe));
        //printf("read nalu data for send, error: %d, %d, %s, %s\n", ret_rframe, AVERROR_EOF, getCodeMsg(ret_rframe), szError);

        if (ret_rframe == AVERROR_EOF) {
            //fclose(g_test_f_aac);
            //g_test_f_aac = NULL;
            return HFLV_DECODE_EOF_CODE;
        }
        return -1;
    }

    //printf("debug start getPacketFunc 2\n");

    int ret = 0;
    char szError[256] = {0};

    if (sniffHttpFlvContext->m_avPacket->stream_index == sniffHttpFlvContext->m_videoIndex) {
        //printf("debug Get Video! is key:%d\n", sniffHttpFlvContext->m_avPacket->flags == AV_PKT_FLAG_KEY);

        //printf("debug start getPacketFunc 3\n");

        if (sniffHttpFlvContext->m_vStartTime < 0) {
            sniffHttpFlvContext->m_vStartTime =
                    (sniffHttpFlvContext->m_avPacket->dts < sniffHttpFlvContext->m_avPacket->pts) ?
                    sniffHttpFlvContext->m_avPacket->dts : sniffHttpFlvContext->m_avPacket->pts;
            //printf("debug m_vStartTime %f\n", sniffHttpFlvContext->m_vStartTime * sniffHttpFlvContext->m_vTimebase);
        }

        sniffHttpFlvContext->m_avPacket->dts -= sniffHttpFlvContext->m_vStartTime;
        sniffHttpFlvContext->m_avPacket->pts -= sniffHttpFlvContext->m_vStartTime;


        // BSF
        ret = av_bsf_send_packet(sniffHttpFlvContext->m_absCtx, sniffHttpFlvContext->m_avPacket);
        if(ret < 0) {
            av_strerror(ret, szError, 256);
            av_packet_unref(sniffHttpFlvContext->m_avPacket);
            printf("pack nalu error:%d %s", ret, szError);
            return ret;
        } // av_bsf_send_packet

        while (av_bsf_receive_packet(sniffHttpFlvContext->m_absCtx, sniffHttpFlvContext->m_avPacket) == 0)
        {
            // // test decode start
            // _decodeVideoPkt(sniffHttpFlvContext);
            // // test decode end

            uint8_t *naluFrame = NULL;
            uint64_t frameLen = 0;
            int appendIdx = 0;

            frameLen = sniffHttpFlvContext->m_avPacket->size;
            naluFrame = (uint8_t *) malloc(sizeof(uint8_t) * frameLen);

            //printf("debug start getSniffStreamPacketFunc 5.2 is key %d\n",
            //sniffHttpFlvContext->m_avPacket->flags == AV_PKT_FLAG_KEY);

            memcpy(naluFrame + appendIdx, HFLV_STARTCODE, 4);
            appendIdx += 4;
            memcpy(naluFrame + appendIdx, sniffHttpFlvContext->m_avPacket->data + 4,
                   sniffHttpFlvContext->m_avPacket->size - 4);

            double v_pts = sniffHttpFlvContext->m_avPacket->pts * sniffHttpFlvContext->m_vTimebase;
            double v_dts = sniffHttpFlvContext->m_avPacket->dts * sniffHttpFlvContext->m_vTimebase;
            //sniffHttpFlvContext->decodeVideoFrameFunc(
            //sniffHttpFlvContext, naluFrame, frameLen,
            //(long) (v_pts * 1000.0), (long) (v_dts * 1000.0), 0);

            // /*
            if (sniffHttpFlvContext->isSetCallback > 0) {
                double v_pts = sniffHttpFlvContext->m_avPacket->pts * sniffHttpFlvContext->m_vTimebase;
                double v_dts = sniffHttpFlvContext->m_avPacket->dts * sniffHttpFlvContext->m_vTimebase;
                int skip = 0;
                if (skip > 0) {
                    // @TODO
                    sniffHttpFlvContext->decodeVideoFrameFunc(
                            sniffHttpFlvContext, naluFrame, frameLen,
                            (long) (v_pts * 1000.0), (long) (v_dts * 1000.0), 0);
                } else {
                    sniffHttpFlvContext->naluFrameCallback(
                            naluFrame, frameLen, sniffHttpFlvContext->m_avPacket->flags == AV_PKT_FLAG_KEY,
                            sniffHttpFlvContext->m_mediaInfo.width, sniffHttpFlvContext->m_mediaInfo.height,
                            v_pts,
                            v_dts);
                }
            }
            // */

            // sniffHttpFlvContext->m_avPacket->flags == AV_PKT_FLAG_KEY
            //ret = MISSILE_PKT_GET_TYPE_HAVE_VIDEO;

            if (NULL != naluFrame) {
                free(naluFrame);
                naluFrame = NULL;
                frameLen = 0;
                appendIdx = 0;
            }
        }
        // av_packet_unref(sniffHttpFlvContext->m_avPacket);

    } else if (sniffHttpFlvContext->m_ignoreAudio == 0
               && sniffHttpFlvContext->m_avPacket->stream_index == sniffHttpFlvContext->m_audioIndex) {
        //printf("Get Audio!\n");

        if (sniffHttpFlvContext->m_aStartTime < 0) {
            sniffHttpFlvContext->m_aStartTime =
                    (sniffHttpFlvContext->m_avPacket->dts < sniffHttpFlvContext->m_avPacket->pts) ?
                    sniffHttpFlvContext->m_avPacket->dts : sniffHttpFlvContext->m_avPacket->pts;
            //printf("debug m_aStartTime %f\n", sniffHttpFlvContext->m_aStartTime * sniffHttpFlvContext->m_aTimebase);
        }

        sniffHttpFlvContext->m_avPacket->dts -= sniffHttpFlvContext->m_aStartTime;
        sniffHttpFlvContext->m_avPacket->pts -= sniffHttpFlvContext->m_aStartTime;

        // test
        //aac_decode_extradata(&AdtsCtx,
        //        sniffHttpFlvContext->m_aCodecContext->extradata,
        //        sniffHttpFlvContext->m_aCodecContext->extradata_size);
        //
        //printf("aac_decode_extradata ==> samplerateIdx:%d channel:%d objectType:%d\n", AdtsCtx.sample_rate_index, AdtsCtx.channel_conf, AdtsCtx.objecttype);

        unsigned char bits[7] = {0};
        int aac_frame_length = 7 + sniffHttpFlvContext->m_avPacket->size;
        int sample_index = find_sample_index(sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate);
        int channels = sniffHttpFlvContext->m_mediaInfo.a_channel;
        if (channels == 8) {
            channels = 7;
        }
        //printf("aac_decode_extradata ==> sampleRate:%d samplerateIdx:%d "
        //       "channel:%d aac_frame_length:%d profile:%d\n",
        //       sniffHttpFlvContext->m_mediaInfo.a_out_sample_rate, sample_index,
        //       channels, aac_frame_length, sniffHttpFlvContext->m_mediaInfo.a_profile);

        bits[0] = 0xff;
        bits[1] = 0xf1;

        // adtsHead[2] = (((profile - 1) << 6) + (freqIdx << 2) + (chanCfg >> 2));
        bits[2] = ((sniffHttpFlvContext->m_mediaInfo.a_profile - 1) << 6) + (sample_index << 2) +(channels >> 2) ;
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
        //fwrite(sniffHttpFlvContext->m_avPacket->data, 1,
        //        sniffHttpFlvContext->m_avPacket->size, g_test_f_aac);

        if (sniffHttpFlvContext->isSetCallback > 0) {
            int aacLen = sniffHttpFlvContext->m_avPacket->size + 7;
            uint8_t *aacFrame = (uint8_t *) malloc(sizeof(uint8_t) * aacLen);

            //printf("debug start getSniffStreamPacketFunc 5.2\n");
            int appendIdx = 0;

            memcpy(aacFrame + appendIdx, bits, 7);
            appendIdx += 7;

            memcpy(aacFrame + appendIdx, sniffHttpFlvContext->m_avPacket->data,
                   sniffHttpFlvContext->m_avPacket->size);

            sniffHttpFlvContext->aacSamplesCallback(
                    // bits,
                    // sniffHttpFlvContext->m_avPacket->data,
                    // sniffHttpFlvContext->m_avPacket->size,
                    aacFrame,
                    sniffHttpFlvContext->m_avPacket->size + 7,
                    sniffHttpFlvContext->m_aCodecContext->channels,
                    sniffHttpFlvContext->m_avPacket->pts * sniffHttpFlvContext->m_aTimebase);

            if (NULL != aacFrame) {
                free(aacFrame);
                aacFrame = NULL;
                aacLen = 0;
                appendIdx = 0;
            }
        }

        /*
         * Decode Audio Frame
         */
        //printf("Get Audio!\n");
        ret = MISSILE_PKT_GET_TYPE_AAC;
    } else {
        ret = MISSILE_PKT_GET_NOTHING;
        //printf("Get Nothing!\n");
    }

    av_packet_unref(sniffHttpFlvContext->m_avPacket);
    //free(sniffHttpFlvContext->m_avPacket);
    //sniffHttpFlvContext->m_avPacket = NULL;
    return ret;
}



/**
 * Decode
 * @param vcodecer
 * @param buff
 * @param in_len
 * @param pts (MS)
 * @return
 */
int hflv_decodeVideoFrameFunc(
        SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buff, int len, long pts, long dts, int tag)
{

    if (sniffHttpFlvContext == NULL) {
        printf("decode frame prepare failed: core ptr is NULL\n");
        return -1;
    }

    if (buff == NULL || len <= 0) {
        printf("decode frame prepare failed: buff is NULL\n");
        return -2;
    }

#if (H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER == 1)

    int ret_len = AV_DEC_NaluNode_Append(sniffHttpFlvContext->m_avDecNaluLinkList,
                                         buff, len, pts, dts, tag, 0);
    if (ret_len < 0) {
        printf("decode frame prepare failed: append nalu LList failed! error code:%d\n", ret_len);
        return ret_len;
    }

    return ret_len;
#endif

    // main

    long decodeStartMS = getMillisecondTime();
    //printf("debug +++ decodeVideoFrameFunc buf:%s len:%d pts:%ld dts:%ld\n", buff, len, pts, dts);

    sniffHttpFlvContext->m_decPacket->data = buff;
    sniffHttpFlvContext->m_decPacket->size = len;
    sniffHttpFlvContext->m_decPacket->pts = pts;
    sniffHttpFlvContext->m_decPacket->dts = dts;
    sniffHttpFlvContext->m_decPacket->tag = tag;
    sniffHttpFlvContext->m_decPacket->skip = 0;

    char szError[256] = {0};
    int sendRet = avcodec_send_packet(sniffHttpFlvContext->m_vDecCodecContext, sniffHttpFlvContext->m_decPacket);

    if (sendRet != 0) {
        if (sendRet == AVERROR(EAGAIN)) {
            printf("send ===========> need again\n");
            return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR_EOF) {
            printf("send ===========> eof\n");
            return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR(EINVAL)) {
            printf("send ===========> inval\n");
            return MISSILE_PKT_GET_NOTHING;
        } else if (sendRet == AVERROR(ENOMEM)) {
            printf("send ===========> oom\n");
            return MISSILE_PKT_GET_NOTHING;
        } else {
            //printf("sendRet ===========> %d\n", sendRet);
            av_strerror(sendRet, szError, 256);
            printf("send message ===========> %s\n", szError);
            return sendRet;
        }
    } // sendRet

    int hasYuv = 0;
    if (sendRet == 0) {
        int rec_re = 0;
        while(1) {
            rec_re = avcodec_receive_frame(sniffHttpFlvContext->m_vDecCodecContext, sniffHttpFlvContext->m_frame);
            if (rec_re == 0) {
                //printf("debug +++++ frame pts:%lld\n", sniffHttpFlvContext->m_frame->pts);
                if (sniffHttpFlvContext->isSetCallback > 0)
                {
                    long decodeEndMS = getMillisecondTime();
                    int decodeCostMS = (int) (decodeEndMS - decodeStartMS);

                    // time_t t1 = time(NULL);
                    // printf("debug callbackYUV==============> time:%ld - %ld = %ld\n",
                    //        decodeEndMS, decodeStartMS, decodeCostMS);

                    sniffHttpFlvContext->yuvFrameCallback(sniffHttpFlvContext->m_frame->data[0],
                                                          sniffHttpFlvContext->m_frame->data[1],
                                                          sniffHttpFlvContext->m_frame->data[2],
                                                          sniffHttpFlvContext->m_frame->linesize[0],
                                                          sniffHttpFlvContext->m_frame->linesize[1],
                                                          sniffHttpFlvContext->m_frame->linesize[2],
                                                          sniffHttpFlvContext->m_frame->width,
                                                          sniffHttpFlvContext->m_frame->height,
                                                          (double) sniffHttpFlvContext->m_frame->pts / 1000.0,
                                                          decodeCostMS);
                    hasYuv += 1;
                } // ok
            } else {
                //printf("rec_re ===========> %d\n", rec_re);
                break;
            }
        }

        if (hasYuv > 0) {
            return MISSILE_PKT_GET_TYPE_YUV;
        }
    } else {
        return MISSILE_PKT_GET_NOTHING;
    }

    //if (rec_re < 0) {
    //    //av_free_packet(vcodecer->avPacket);
    //    av_strerror(rec_re, szError, 256);
    //    printf("[x] Decode Failed! 0.1 : %d, %s\n", rec_re, szError);
    //    return rec_re;
    //}
    //
    //if (frameFinished && sniffHttpFlvContext->isSetCallback > 0) {
    //    sniffHttpFlvContext->yuvFrameCallback(sniffHttpFlvContext->m_frame->data[0],
    //                                         sniffHttpFlvContext->m_frame->data[1],
    //                                         sniffHttpFlvContext->m_frame->data[2],
    //                                         sniffHttpFlvContext->m_frame->linesize[0],
    //                                         sniffHttpFlvContext->m_frame->linesize[1],
    //                                         sniffHttpFlvContext->m_frame->linesize[2],
    //                                         sniffHttpFlvContext->m_mediaInfo.width,
    //                                         sniffHttpFlvContext->m_mediaInfo.height,
    //                                         (double) sniffHttpFlvContext->m_frame->pts / 1000.0);
    //    return MISSILE_PKT_GET_TYPE_YUV;
    //} // ok

    //if (NULL != sniffHttpFlvContext->m_pktNodeHead) {
    //    if (sniffHttpFlvContext->m_pktNodePlayPtr == NULL) {
    //        sniffHttpFlvContext->m_pktNodePlayPtr = sniffHttpFlvContext->m_pktNodeHead;
    //    }
    //
    //    sniffHttpFlvContext->m_pktNodePlayPtr = sniffHttpFlvContext->m_pktNodePlayPtr;
    //
    //    AVPacket *pkt = sniffHttpFlvContext->m_pktNodePlayPtr->avPacket;
    //
    //    // do
    //    // @TODO
    //    int frameFinished = 0;
    //    // 解码
    //    int recvRet = avcodec_decode_video2(
    //            sniffHttpFlvContext->m_vCodecContext, sniffHttpFlvContext->m_frame, &frameFinished, pkt);
    //    //int recvRet = avcodec_receive_frame(sniffHttpFlvContext->m_vCodecContext, sniffHttpFlvContext->m_frame);
    //    //printf("recvRet ===========> %d\n", recvRet);
    //
    //    //double vTime = pkt->pts * sniffHttpFlvContext->m_vTimebase;
    //
    //    if (frameFinished && sniffHttpFlvContext->isSetCallback > 0) {
    //    //if (recvRet >= 0 && sniffHttpFlvContext->isSetCallback > 0) {
    //        sniffHttpFlvContext->yuvFrameCallback(sniffHttpFlvContext->m_frame->data[0],
    //                                             sniffHttpFlvContext->m_frame->data[1],
    //                                             sniffHttpFlvContext->m_frame->data[2],
    //                                             sniffHttpFlvContext->m_frame->linesize[0],
    //                                             sniffHttpFlvContext->m_frame->linesize[1],
    //                                             sniffHttpFlvContext->m_frame->linesize[2],
    //                                             sniffHttpFlvContext->m_mediaInfo.width,
    //                                             sniffHttpFlvContext->m_mediaInfo.height,
    //                                             sniffHttpFlvContext->m_frame->pts * sniffHttpFlvContext->m_vTimebase);
    //    } // ok
    //
    //    // next frame
    //    sniffHttpFlvContext->m_pktNodePlayPtr = sniffHttpFlvContext->m_pktNodePlayPtr->next;
    //    return MISSILE_PKT_GET_TYPE_YUV;
    //}

    return MISSILE_PKT_GET_NOTHING;
}

/**
 *
 ************************************** @outside functions
 *
 */
SniffHTTPFLVContext *newSniffHTTPFLVContext() {
    SniffHTTPFLVContext *sniffHttpFlvContext =
            (SniffHTTPFLVContext *)malloc(sizeof(SniffHTTPFLVContext));

    sniffHttpFlvContext->m_mode              = MISSILE_SNIFFSTREAM_MODE_VOD;
    sniffHttpFlvContext->initFunc            = hflv_initFunc;
    sniffHttpFlvContext->releaseFunc         = hflv_releaseFunc;
    sniffHttpFlvContext->introduceMineFunc   = introduce_mine;
    sniffHttpFlvContext->pushBufferFunc      = hflv_pushBufferFunc;
    sniffHttpFlvContext->getBufferLength     = hflv_getBufferLength;
    sniffHttpFlvContext->getPacketFunc       = hflv_getPacketFunc;
    sniffHttpFlvContext->decodeVideoFrameFunc= hflv_decodeVideoFrameFunc;
    sniffHttpFlvContext->setCodecTypeFunc    = hflv_setSniffStreamCodecTypeFunc;
    return sniffHttpFlvContext;
}

int releaseSniffHTTPFLVContext(SniffHTTPFLVContext *sniffHttpFlvContext) {
    printf("exec release sniff stream ctx\n");
    if (sniffHttpFlvContext == NULL) {
        return -1;
    }

    IS_INTRODUCE_MINE = 0;

    sniffHttpFlvContext->m_threadRefresh = 1;
    int ret = sniffHttpFlvContext->releaseFunc(sniffHttpFlvContext);

    sniffHttpFlvContext->initFunc            = NULL;
    sniffHttpFlvContext->introduceMineFunc   = NULL;
    sniffHttpFlvContext->pushBufferFunc      = NULL;
    sniffHttpFlvContext->getBufferLength     = NULL;
    sniffHttpFlvContext->getPacketFunc       = NULL;
    sniffHttpFlvContext->decodeVideoFrameFunc= NULL;
    sniffHttpFlvContext->setCodecTypeFunc    = NULL;
    sniffHttpFlvContext->releaseFunc         = NULL;

    printf("code of release sniff stream ctx:%d\n", ret);
    return ret;
}
