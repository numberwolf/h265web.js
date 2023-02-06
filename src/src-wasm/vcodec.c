#include <stdio.h>
#include "vcodec.h"
#include "libswscale/swscale.h"
#include "libavutil/pixdesc.h"
#include "about.h"
#include "utils/tools.h"
#include "utils/secret.h"
// #include <string.h>
#include "utils/common_string.h"
#include "utils/common_av.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/fetch.h>
#include <emscripten.h>
#endif

VCodecContext *vcodecerTempPtr = NULL;

/*
 * ***********************************************************
 *
 *
 *                       Permission Verify - HTTP
 *
 *
 * ***********************************************************
 */
void downloadSucceeded(emscripten_fetch_t *fetch) {
    //printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
    // The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
    for (size_t i = 0; i < fetch->numBytes; ++i) {
        printf("%c", fetch->data[i]);
    }
    printf("\n");

    char firstCode = '2';

    if (fetch->data[0] == '2' &&
        fetch->data[1] == '0' &&
        fetch->data[2] == '0'
            ) {
        printf("permitted OK\n");
        vcodecerTempPtr->permitted = 1;
    } else {
        printf("permitted FAILED\n");
    }
    vcodecerTempPtr = NULL;
    emscripten_fetch_close(fetch); // Free data associated with the fetch.
}

void downloadFailed(emscripten_fetch_t *fetch) {
    //printf("Downloading %s failed, HTTP failure status code: %d.\n", fetch->url, fetch->status);
    emscripten_fetch_close(fetch); // Also free data on failure.
    vcodecerTempPtr = NULL;
}


int verifyRequest(VCodecContext *vcodecer) {
    emscripten_fetch_attr_t attr;
    emscripten_fetch_attr_init(&attr);
    strcpy(attr.requestMethod, "GET");
    attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
    attr.onsuccess = downloadSucceeded;
    attr.onerror = downloadFailed;

    char requestURI[256];

    /****************************************************
     * 签名算法开始 Sign algorithm start
     */
    long nowTimestamp = getTimestampSec();
    int randomKey = getRandom(RANDOM_MAX);
    char randomKeyStr[5];
    sprintf(randomKeyStr, "%ld%d", nowTimestamp % SIGN_INT_SPLIT_BASE, randomKey % SIGN_INT_SPLIT_BASE);

    // 这里返回的const char*必须先接住才行
    char sign[33];
    strcpy(sign, encryptMd5(randomKeyStr, SIGN_INT_SPLIT_BASE_LEN + SIGN_INT_SPLIT_BASE_LEN));
    /*
     * 签名算法技术 Sign algorithm End
     *****************************************************/

    sprintf(
            requestURI,
            "http://apih265webjs.yuveye.com/?"
            "c=domainLimit&a=check"
            "&key=%s&key1=%ld&key2=%d&sign=%s",
            H265WEBJS_VERSION,
            nowTimestamp,
            randomKey,
            sign);

    //for (int i = 0; i < 32; i++) {
    //    printf("%c ", sign[i]);
    //}
    //printf("\n");

    //emscripten_fetch(&attr, "http://apih265webjs.yuveye.com/?c=domainLimit&a=check&t=123124214124");
    emscripten_fetch(&attr, requestURI);

    vcodecerTempPtr = vcodecer;
    printf("[v] all ok now\n");
    return 0;
}

/*
 * ***********************************************************
 *
 *
 *                       Decoder
 *
 *
 * ***********************************************************
 */
// -3 not init, 0 ok ,-1 fail
int initializeDecoderFunc(VCodecContext *vcodecer) {
    introduce_mine();
    av_log_set_level(AV_LOG_QUIET);

    if (vcodecer == NULL) {
        return -3;
    }

    // verify
    if (vcodecer->useFree == H265WEBJS_USE_FREE) {
        vcodecer->permitted = 1;
    } else {
        // 不是免费就验证
        verifyRequest(vcodecer);
    }

    // start
    vcodecer->introduceMineFunc();

    //avcodec_register_all();
    printf("VideoMissile init done : codec:%d\n", vcodecer->codecType);
    // avcodec_register_all();

    // codec = avcodec_find_decoder(AV_CODEC_ID_H264);
    if (vcodecer->codecType == CODEC_H265) {
        vcodecer->codec = avcodec_find_decoder(AV_CODEC_ID_HEVC);
        printf(" codec 265\n");
    } else if (vcodecer->codecType == CODEC_H264) {
        vcodecer->codec = avcodec_find_decoder(AV_CODEC_ID_H264);
        printf(" codec 264\n");
    } else {
        // default is hevc
        vcodecer->codec = avcodec_find_decoder(AV_CODEC_ID_HEVC);
    }
    //vcodecer->codec = avcodec_find_decoder(AV_CODEC_ID_HEVC);
    if (!vcodecer->codec) {
        printf("vcodec module find decoder failed\n");
        return -1;
    }

    const char *codecName = vcodecer->codec->name;
    // printf("codecName:%s\n",codecName);

    vcodecer->codecContext = avcodec_alloc_context3(vcodecer->codec);
    if (!vcodecer->codecContext) {
        printf("vcodec module alloc decoder context failed\n");
        return -1;
    }

    //if (avcodec_open2(vcodecer->codecContext, vcodecer->codec, NULL) < 0) {
    if (avcodec_open2(vcodecer->codecContext, vcodecer->codec, 0) < 0) {
        printf("vcodec module init open decoder failed\n");
        return -1;
    }

    vcodecer->codecContext->thread_count = MISSILE_DEC_THREAD_COUNT;
    vcodecer->codecContext->thread_type = FF_THREAD_FRAME;
    vcodecer->codecContext->flags |= AV_CODEC_FLAG_TRUNCATED;

    vcodecer->frame = av_frame_alloc();
    if (!vcodecer->frame) {
        printf("vcodec module alloc dec frame ctx failed\n");
        return -1;
    }

    vcodecer->outFrame = av_frame_alloc();
    if (!vcodecer->outFrame) {
        printf("vcodec module alloc out frame ctx failed\n");
        return -1;
    }

    vcodecer->avPacket = av_packet_alloc();
    av_init_packet(vcodecer->avPacket);
    if (!vcodecer->avPacket) {
        printf("vcodec module alloc dec pkg ctx failed\n");
        return -1;
    }

    //vcodecer->imageData               = (ImageData *)malloc(sizeof(ImageData));
    //vcodecer->imageData->width        = 0;
    //vcodecer->imageData->height       = 0;
    //vcodecer->imageData->dataY        = NULL;
    //vcodecer->imageData->dataChromaB  = NULL;
    //vcodecer->imageData->dataChromaR  = NULL;

    //vcodecer->v_needScale = (
    //        vcodecer->codecContext->pix_fmt == AV_PIX_FMT_YUV420P
    //) ? 0 : 1;
    //
    //// @TODO trans frame to yuv420p
    //printf("need scale : %d, %s\n",
    //        vcodecer->v_needScale, av_pix_fmt_desc_get(vcodecer->codecContext->pix_fmt)->name);
    return 0;
}

/**
 * Decode
 * @param vcodecer
 * @param buff
 * @param in_len
 * @param pts (MS)
 * @return
 */
/*
int decodeCodecContextFunc(VCodecContext *vcodecer, uint8_t *buff, int in_len, long pts, int flush) {
    if (vcodecer == NULL || vcodecer->permitted < 1) {
        return -3;
    }

    vcodecer->debugNum += 1;
    if (vcodecer->debugNum % 24 == 0) {
        //introduce_mine();
    }

    if (flush > 0) {
        avcodec_flush_buffers(vcodecer->codecContext);
    }
    //avcodec_flush_buffers(sniffStreamContext->m_aCodecContext);

    //AVPacket pkt;
    //av_init_packet(&pkt);
    //pkt.data = buff;
    //pkt.size = in_len;

    vcodecer->avPacket->data = buff;
    vcodecer->avPacket->size = in_len;
    vcodecer->avPacket->pts = pts;
    //vcodecer->avPacket->dts = pts;

    // printf("==========> len :%d, data: %d %d %d %d %d...%d %d %d %d %d\n",
    //     pkt.size,
    //     pkt.data[0],
    //     pkt.data[1],
    //     pkt.data[2],
    //     pkt.data[3],
    //     pkt.data[4],
    //     pkt.data[pkt.size-1-4],
    //     pkt.data[pkt.size-1-3],
    //     pkt.data[pkt.size-1-2],
    //     pkt.data[pkt.size-1-1],
    //     pkt.data[pkt.size-1-0]
    // );

    char szError[256] = {0};

    int frameFinished = -1;
    int rec_re = avcodec_decode_video2(vcodecer->codecContext, vcodecer->frame, &frameFinished, vcodecer->avPacket);
    if (rec_re < 0) {
        //av_free_packet(vcodecer->avPacket);
        av_strerror(rec_re, szError, 256);
        printf("[x] Decode Failed! 0.1 : %d, %s\n", rec_re, szError);
        return -2;
    }

    // Need behind decode frame
    if (vcodecer->v_needScale < 0) {
        vcodecer->v_needScale = (
                vcodecer->codecContext->pix_fmt == AV_PIX_FMT_YUV420P
        ) ? 0 : 1;

        // @TODO trans frame to yuv420p
        //printf("need scale : %d, %s\n",
        //       vcodecer->v_needScale, av_pix_fmt_desc_get(vcodecer->codecContext->pix_fmt)->name);
    }

    //const char *pix_fmt_name = av_get_pix_fmt_name(vcodecer->codecContext->pix_fmt);
    //size_t pix_fmt_name_len = strlen(pix_fmt_name);
    //printf("debug pix_fmt_name:%s, len:%d\n", pix_fmt_name, pix_fmt_name_len);

    //const char *pix_fmt_name = av_get_pix_fmt_name(vcodecer->codecContext->pix_fmt);
    //int pix_fmt_name_len = strlen(pix_fmt_name);
    //printf("debug pix_fmt_name:%s, len:%d\n", pix_fmt_name, pix_fmt_name_len);
    //
    //char *v_pixelFormat = (char *)malloc(sizeof(char) * pix_fmt_name_len);
    //strcpy(v_pixelFormat, pix_fmt_name);
    //printf("debug 2 pix_fmt_name:%s\n", v_pixelFormat);

    if (frameFinished > 0) {
        if (vcodecer->v_width <= 0 || vcodecer->v_height <= 0) {
            vcodecer->v_width = vcodecer->frame->width;
            vcodecer->v_height = vcodecer->frame->height;
        }
        vcodecer->_getFrame(vcodecer);
    }

    //av_free_packet(vcodecer->avPacket);
    return frameFinished;
}
*/

/**
 * Decode
 * @param vcodecer
 * @param buff
 * @param in_len
 * @param pts (MS)
 * @return
 */
int decodeCodecContextFunc(VCodecContext *vcodecer, uint8_t *buff, int in_len, long pts, int flush) {
    if (vcodecer == NULL || vcodecer->permitted < 1) {
        return -1;
    }

    vcodecer->debugNum += 1;
    if (vcodecer->debugNum % 24 == 0) {
        //introduce_mine();
    }

    if (flush > 0) {
        //avcodec_flush_buffers(vcodecer->codecContext);
        //avcodec_send_packet(vcodecer->codecContext, NULL);
    }
    //avcodec_flush_buffers(sniffStreamContext->m_aCodecContext);

    //printf("debug +++ decodeVideoFrameFunc len:%d pts:%ld\n", in_len, pts);

    //AVPacket pkt;
    //av_init_packet(&pkt);
    //pkt.data = buff;
    //pkt.size = in_len;

    vcodecer->avPacket->data = buff;
    vcodecer->avPacket->size = in_len;
    vcodecer->avPacket->pts = pts;
    //vcodecer->avPacket->dts = pts;

    char szError[256] = {0};

    // dev
    int sendRet = avcodec_send_packet(vcodecer->codecContext, vcodecer->avPacket);

    if (sendRet == AVERROR(EAGAIN)) {
        printf("sendRet ===========> EAGAIN\n");
        return -2;
    } else if (sendRet == AVERROR_EOF) {
        printf("sendRet ===========> AVERROR_EOF\n");
        //avcodec_flush_buffers(vcodecer->codecContext);
        return -3;
    } else if (sendRet == AVERROR(EINVAL)) {
        printf("sendRet ===========> EINVAL\n");
        return -4;
    } else if (sendRet == AVERROR(ENOMEM)) {
        printf("sendRet ===========> ENOMEM\n");
        return -5;
    } else {
        //printf("sendRet ===========> %d\n", sendRet);
    }

    int hasYuv = 0;
    if (sendRet == 0) {
        int rec_re = 0;
        while (1) {
            rec_re = avcodec_receive_frame(vcodecer->codecContext, vcodecer->frame);
            if (rec_re == 0) {
                // Need behind decode frame
                if (vcodecer->v_needScale < 0) {
                    vcodecer->v_needScale = (
                            vcodecer->codecContext->pix_fmt == AV_PIX_FMT_YUV420P
                    ) ? 0 : 1;
                } // need scale

                if (vcodecer->v_width <= 0 || vcodecer->v_height <= 0) {
                    vcodecer->v_width = vcodecer->frame->width;
                    vcodecer->v_height = vcodecer->frame->height;
                } // width height

                //printf("debug +++++ frame pts:%lld\n", vcodecer->frame->pts);
                hasYuv++;
                vcodecer->_getFrame(vcodecer);
            } else {
                if (rec_re == AVERROR(EAGAIN)) {
                    //printf("rec_re ===========> EAGAIN\n");
                    //return -2;
                } else if (rec_re == AVERROR_EOF) {
                    //printf("rec_re ===========> AVERROR_EOF\n");
                    //avcodec_flush_buffers(vcodecer->codecContext);
                    //return -3;
                } else if (rec_re == AVERROR(EINVAL)) {
                    //printf("rec_re ===========> EINVAL\n");
                    //return -4;
                } else if (rec_re == AVERROR(ENOMEM)) {
                    //printf("rec_re ===========> ENOMEM\n");
                    //return -5;
                } else {
                    printf("rec_re ===========> %d\n", AVERROR(sendRet));
                }
                //printf("rec_re ===========> %d\n", rec_re);
                break;
            } // end rec_re === 0
        } // end while
    } // end sendRet == 0

    // dev end
    return hasYuv;
} // decodeCodecContextFunc

/**
 * Private
 * @param vcodecer
 * @return
 */
int _getFrame(VCodecContext *vcodecer) {
    if (vcodecer == NULL || vcodecer->permitted < 1) {
        return -3;
    }

    if (vcodecer->v_timebase < 0) {
        vcodecer->v_timebase = av_q2d(vcodecer->codecContext->time_base);
    }

    //double timestampNow = vcodecer->v_timebase * vcodecer->avPacket->pts;
    //printf("_getFrame ==>, timebase=%f, pkt:dts=%ld, pts=%ld, frame:pts:%ld\n",
    //       vcodecer->v_timebase, vcodecer->avPacket->dts, vcodecer->avPacket->pts, vcodecer->frame->pts);

    //printf("NEED SCALE=================> %d\n", vcodecer->v_needScale);

    // do not need scale
    if (vcodecer->v_needScale <= 0) {
        vcodecer->videoCallback(
                vcodecer->frame->data[0],
                vcodecer->frame->data[1],
                vcodecer->frame->data[2],
                vcodecer->frame->linesize[0],
                vcodecer->frame->linesize[1],
                vcodecer->frame->linesize[2],
                vcodecer->v_width, vcodecer->v_height,
                vcodecer->avPacket->pts);
        return 0;
    }

    ///*
    // * Trans GL
    // */
    ////printf("need scale : %d, %d\n", vcodecer->v_needScale, vcodecer->frame->format);
    //if (vcodecer->v_width <= 0 || vcodecer->v_height <= 0) {
    //    vcodecer->v_width     = vcodecer->frame->width;
    //    vcodecer->v_height    = vcodecer->frame->height;
    //    // printf("[v]width ,height : %d, %d\n",v_width,v_height);
    //
    //    if (vcodecer->imageData != NULL && (vcodecer->imageData->width <= 0 || vcodecer->imageData->height <= 0)) {
    //        vcodecer->imageData->width = vcodecer->v_width;
    //        vcodecer->imageData->height = vcodecer->v_height;
    //    }
    //}
    //if (vcodecer->imageData != NULL) {
    //    if (vcodecer->imageData->dataY != NULL) {
    //        free(vcodecer->imageData->dataY);
    //        vcodecer->imageData->dataY       = NULL;
    //    }
    //
    //    if (vcodecer->imageData->dataChromaB != NULL) {
    //        free(vcodecer->imageData->dataChromaB);
    //        vcodecer->imageData->dataChromaB  = NULL;
    //    }
    //
    //    if (vcodecer->imageData->dataChromaR != NULL) {
    //        free(vcodecer->imageData->dataChromaR);
    //        vcodecer->imageData->dataChromaR  = NULL;
    //    }
    //}
    //// Do
    int wh_size = vcodecer->v_width * vcodecer->v_height;
    //vcodecer->imageData->dataY        = (uint8_t *)malloc(wh_size);
    //vcodecer->imageData->dataChromaB  = (uint8_t *)malloc(wh_size/4);
    //vcodecer->imageData->dataChromaR  = (uint8_t *)malloc(wh_size/4);

    // Frames
    uint8_t *out_buffer = NULL;

    if (vcodecer->swCtx == NULL) {
        vcodecer->swCtx = sws_getContext(
                vcodecer->v_width, vcodecer->v_height,
                vcodecer->codecContext->pix_fmt, // in ,vcodec->frame->format
                vcodecer->v_width, vcodecer->v_height,
                AV_PIX_FMT_YUV420P, // out
                SWS_FAST_BILINEAR, NULL, NULL, NULL); // liner algorithm SWS_BICUBIC
    }

    vcodecer->outFrame->width     = vcodecer->v_width;
    vcodecer->outFrame->height    = vcodecer->v_height;
    vcodecer->outFrame->format    = AV_PIX_FMT_YUV420P;

    // uint8_t *out_buffer = (uint8_t *)av_malloc(avpicture_get_size(AV_PIX_FMT_YUV420P, vcodecer->v_width, vcodecer->v_height) * sizeof(uint8_t));
    out_buffer = (uint8_t *)av_malloc((int)(wh_size * 1.5) * sizeof(uint8_t));
    avpicture_fill(
            (AVPicture *)vcodecer->outFrame, out_buffer,
            AV_PIX_FMT_YUV420P, vcodecer->v_width, vcodecer->v_height);
    // avpicture_alloc((AVPicture *)vcodecer->outFrame, AV_PIX_FMT_YUV420P, vcodecer->v_width, vcodecer->v_height);

    // @todo
    //int dummy[4];
    //int srcRange, dstRange;
    //int brightness, contrast, saturation;
    //sws_getColorspaceDetails(
    //        vcodecer->swCtx, (int**)&dummy, &srcRange, (int**)&dummy, &dstRange, &brightness, &contrast, &saturation);
    //const int* coefs = sws_getCoefficients(SWS_CS_DEFAULT);
    //srcRange = 1; // this marks that values are according to yuvj
    //sws_setColorspaceDetails(vcodecer->swCtx, coefs, srcRange, coefs, dstRange,
    //                         brightness, contrast, saturation);
    // end todo

    sws_scale(vcodecer->swCtx,
        (const uint8_t* const*)vcodecer->frame->data,
        vcodecer->frame->linesize, // (const uint8_t* const*)
        0, vcodecer->v_height,
              vcodecer->outFrame->data,
              vcodecer->outFrame->linesize);

    //int i;
    //for (i = 0; i<vcodecer->v_height; i++) {
    //    memcpy(vcodecer->imageData->dataY + vcodecer->v_width*i, vcodecer->outFrame->data[0] + i * vcodecer->outFrame->linesize[0], vcodecer->v_width);
    //}
    //for (i = 0; i<vcodecer->v_height / 2; i++) {
    //    memcpy(
    //        vcodecer->imageData->dataChromaB + vcodecer->v_width/2*i,
    //        vcodecer->outFrame->data[1] + i * vcodecer->outFrame->linesize[1],
    //        vcodecer->v_width / 2
    //    );
    //}
    //for (i = 0; i<vcodecer->v_height / 2; i++) {
    //    memcpy(vcodecer->imageData->dataChromaR + vcodecer->v_width/2*i, vcodecer->outFrame->data[2] + i * vcodecer->outFrame->linesize[2], vcodecer->v_width / 2);
    //}

    //printf("callback: %d\n", vcodecer->videoCallback);
    vcodecer->videoCallback(
            vcodecer->outFrame->data[0],
            vcodecer->outFrame->data[1],
            vcodecer->outFrame->data[2],
            vcodecer->outFrame->linesize[0],
            vcodecer->outFrame->linesize[1],
            vcodecer->outFrame->linesize[2],
            vcodecer->v_width, vcodecer->v_height,
            vcodecer->avPacket->pts);

    //av_frame_free(&vcodecer->outFrame);       //av_frame_alloc()
    //vcodecer->outFrame = NULL;
    av_free(out_buffer);
    out_buffer = NULL;

    /*
     * 进行打水印 1
     */
     //int distence = 0;
     //if (vcodecer->v_height < 60) {
     //    distence    = 5;
     //} else {
     //    distence    = 15;
     //}
     //int startTag    = vcodecer->v_height/2 - distence;
     //int endTag      = vcodecer->v_height/2 + distence;
     //int i0, j0;
     //for (i0 = startTag; i0 < endTag; i0 ++ ) {
     //     for (j0 = 0; j0 < vcodecer->v_width; j0 ++ ) {
     //         vcodecer->imageData->dataY[i0*vcodecer->v_width + j0] = 0;
     //     }
     //}
    /*
     * 进行打水印 2
     */
    // int startTag1    = vcodecer->v_width/2 - 10;
    // int endTag1      = vcodecer->v_width/2 + 10;
    // int i1, j1;
    // for (i1 = startTag1; i1 < endTag1; i1 ++ ) {
    //      for (j1 = 0; j1 < vcodecer->v_height; j1 ++ ) {
    //          vcodecer->imageData->dataY[j1*vcodecer->v_width + i1] = 0;
    //      }
    // }

    // printf( "%s\n", "start get Frame Buffer");
    // printf("start init buffer:%d\n", v_height * v_width * 3);
    // uint8_t *buffer = (uint8_t *)malloc(v_height * v_width * 3);
    // printf("buffer size:%d\n", v_height * v_width * 3);
    // printf("readFrame => linesize[0]:%d,%d,%d\n", pFrameRGB->linesize[0],pFrameRGB->linesize[1],pFrameRGB->linesize[2]);
    // for (int y = 0; y < v_height; y++) {
    //     // fwrite(pFrameRGB->data[0]+y*pFrameRGB->linesize[0], 1, width*3, pFile);
    //     memcpy(buffer + y * pFrameRGB->linesize[0], pFrameRGB->data[0] + y * pFrameRGB->linesize[0], v_width * 3);
    // }
    // imageData->data = buffer;

    // printf( "%s\n", "over set imageData");
    // printf( "imageData->width:%d\n", imageData->width);
    // printf( "imageData->height:%d\n", imageData->height);

    return 0;
}

int setCodecTypeFunc(VCodecContext *vcodecer, CODEC_TYPE codecType, long callback) {
    vcodecer->codecType = codecType;
    vcodecer->videoCallback = (VideoCallback) callback;
    return 0;
}

int closeVideoFunc(VCodecContext *vcodecer) {
    introduce_mine();
    return 0;
}

int releaseFunc(VCodecContext *vcodecer) {
    if (vcodecer == NULL) {
        return -3;
    }
    vcodecer->introduceMineFunc();
    // printf("releaseFunc begin\n");

    // printf("releaseFunc frame begin\n");

    IS_INTRODUCE_MINE = 0;

    if (vcodecer->frame != NULL) {
        av_frame_free(&vcodecer->frame);
        vcodecer->frame = NULL;

        av_packet_unref(vcodecer->avPacket);
        vcodecer->avPacket = NULL;
    }

    if (vcodecer->outFrame != NULL) {
        av_frame_free(&vcodecer->outFrame);
        vcodecer->outFrame = NULL;
    }

    // printf("releaseFunc codecContext begin\n");
    if (NULL != vcodecer->codecContext) {
        avcodec_close(vcodecer->codecContext);
        vcodecer->codecContext = NULL;
    }

    if (NULL != vcodecer->swCtx) {
        sws_freeContext(vcodecer->swCtx);
        vcodecer->swCtx = NULL;
    }

    // printf("releaseFunc imageData begin\n");
    //if (vcodecer->imageData != NULL) {
    //    if (vcodecer->imageData->dataY != NULL) {
    //        free(vcodecer->imageData->dataY);
    //        vcodecer->imageData->dataY = NULL;
    //    }
    //    if (vcodecer->imageData->dataChromaB != NULL) {
    //        free(vcodecer->imageData->dataChromaB);
    //        vcodecer->imageData->dataChromaB = NULL;
    //    }
    //    if (vcodecer->imageData->dataChromaR != NULL) {
    //        free(vcodecer->imageData->dataChromaR);
    //        vcodecer->imageData->dataChromaR = NULL;
    //    }
    //    free(vcodecer->imageData);
    //    vcodecer->imageData = NULL;
    //}

    // printf("releaseFunc codec begin\n");
    vcodecer->v_timebase  = -1;
    vcodecer->codec       = NULL;
    vcodecer->avPacket    = NULL;
    vcodecer->v_width     = -1;
    vcodecer->v_height    = -1;

    vcodecer->debugNum    = 0;

    return 0;
}

void introduceMineFunc() {
    introduce_mine();
}

/**
 * Entry
 */
VCodecContext* initVcodec() {
    introduce_mine();
    VCodecContext *vcodecer = (VCodecContext *)malloc(sizeof(VCodecContext));
    // if (vcodecer == NULL) {
    //     printf("vcodecer is NULL,to malloc\n");
    //     vcodecer = (VCodecContext *)malloc(sizeof(VCodecContext));
    // }

    vcodecer->videoCallback = NULL;

    vcodecer->v_timebase    = -1;
    vcodecer->codec         = NULL;
    vcodecer->codecContext  = NULL;
    vcodecer->frame         = NULL;
    vcodecer->outFrame      = NULL;
    vcodecer->swCtx         = NULL;
    //vcodecer->imageData     = NULL;

    vcodecer->v_width       = -1;
    vcodecer->v_height      = -1;
    vcodecer->permitted     = -1;
    vcodecer->useFree       = H265WEBJS_USE_NOT_FREE;
    vcodecer->v_needScale   = -1;

    vcodecer->initializeDecoderFunc     = initializeDecoderFunc;
    vcodecer->setCodecTypeFunc          = setCodecTypeFunc;
    vcodecer->introduceMineFunc         = introduceMineFunc;
    vcodecer->decodeCodecContextFunc    = decodeCodecContextFunc;
    vcodecer->_getFrame                 = _getFrame;
    vcodecer->closeVideoFunc            = closeVideoFunc;
    vcodecer->releaseFunc               = releaseFunc;

    vcodecer->debugNum    = 0;

    vcodecer->codecType = CODEC_H265;

    return vcodecer;
}

int exitVcodec(VCodecContext *vcodecer) {
    introduce_mine();
    if (vcodecer == NULL) {
        return 0;
    }
    vcodecer->introduceMineFunc();
    vcodecer->releaseFunc(vcodecer);

    vcodecer->initializeDecoderFunc     = NULL;
    vcodecer->introduceMineFunc         = NULL;
    vcodecer->decodeCodecContextFunc    = NULL;
    vcodecer->_getFrame                 = NULL;
    vcodecer->closeVideoFunc            = NULL;
    vcodecer->releaseFunc               = NULL;

    free(vcodecer);
    vcodecer = NULL;

    return 0;
}



