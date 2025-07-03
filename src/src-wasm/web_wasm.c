#include <emscripten.h>
//#include <wasm_simd128.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#include "utils/common_string.h" // option
#include "utils/secret.h"
#include "utils/tools.h"
#include "utils/ts_utils.h"

#include "about.h"

#include "vcodec.h"
#include "ts_parser.h"
#include "sniff_stream.h"
#include "sniff_httpflv.h"
#include "sniff_g711core.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/fetch.h>
#include <emscripten.h>
#endif

// Global
//VCodecContext *vcodecer = NULL;
// 岂曰无衣，与子同袍！

///**
// * Print no output.
// */
//#define AV_LOG_QUIET    -8
//
///**
// * Something went really wrong and we will crash now.
// */
//#define AV_LOG_PANIC     0
//
///**
// * Something went wrong and recovery is not possible.
// * For example, no header was found for a format which depends
// * on headers or an illegal combination of parameters is used.
// */
//#define AV_LOG_FATAL     8
//
///**
// * Something went wrong and cannot losslessly be recovered.
// * However, not all future data is affected.
// */
//#define AV_LOG_ERROR    16
//
///**
// * Something somehow does not look correct. This may or may not
// * lead to problems. An example would be the use of '-vstrict -2'.
// */
//#define AV_LOG_WARNING  24
//
///**
// * Standard information.
// */
//#define AV_LOG_INFO     32
//
///**
// * Detailed information.
// */
//#define AV_LOG_VERBOSE  40
//
///**
// * Stuff which is only useful for libav* developers.
// */
//#define AV_LOG_DEBUG    48
//
///**
// * Extremely verbose debugging, useful for libav* development.
// */
//#define AV_LOG_TRACE    56
//av_log_set_level(AV_LOG_QUIET);




/*
 * ***********************************************************
 *
 *
 *                       Log Version domain - HTTP
 *
 *
 * ***********************************************************
 */

void logRequest_downloadSucceeded(emscripten_fetch_t *fetch) {
    //printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
    // The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
    for (size_t i = 0; i < fetch->numBytes; ++i) {
        printf("%c", fetch->data[i]);
    }
    printf("\n");
    emscripten_fetch_close(fetch); // Free data associated with the fetch.
}

void logRequest_downloadFailed(emscripten_fetch_t *fetch) {
    //printf("Downloading %s failed, HTTP failure status code: %d.\n", fetch->url, fetch->status);
    emscripten_fetch_close(fetch); // Also free data on failure.
}


/*
 * @param log_type (int) 0: default 1: request missile.js
 */
int logRequest_sendVersionByType(const char* version, int log_type) {
    emscripten_fetch_attr_t attr;
    emscripten_fetch_attr_init(&attr);
    strcpy(attr.requestMethod, "GET");
    attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
    attr.onsuccess = logRequest_downloadSucceeded;
    attr.onerror = logRequest_downloadFailed;

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

    //sprintf(
    //        requestURI,
    //        "http://apih265webjs.yuveye.com/?"
    //        "c=log&a=version"
    //        "&version=%s&key1=%ld&key2=%d&sign=%s",
    //        version,
    //        nowTimestamp,
    //        randomKey,
    //        sign);

    if (log_type == 1) { // action=include_missilejs
        sprintf(
                requestURI,
                "https://www.zzsin.com/eye/user/anchor/anchor?"
                "type=info&app=h265web&page=player&block=player&action=include_missilejs&info=version=%s;timestamp=%ld",
                version,
                nowTimestamp);

    } else { // action=build
        sprintf(
                requestURI,
                "https://www.zzsin.com/eye/user/anchor/anchor?"
                "type=info&app=h265web&page=player&block=player&action=build&info=version=%s;timestamp=%ld",
                version,
                nowTimestamp);
    }

    //emscripten_fetch(&attr, "http://apih265webjs.yuveye.com/?c=domainLimit&a=check&t=123124214124");
    emscripten_fetch(&attr, requestURI);
    printf("[v] all ok now\n");
    return 0;
}



int logRequest_sendVersion(const char* version) {
    return logRequest_sendVersionByType(version, 0);
}

int logRequest_sendVersionIncludeJS(const char* version) {
    return logRequest_sendVersionByType(version, 1);
}




/* ****************************************************************
 *
 *
 *
 *             1.Decoder
 *
 *
 *
 * ****************************************************************/

EMSCRIPTEN_KEEPALIVE VCodecContext *registerPlayer(const char *token, const char* version) {
    int free = H265WEBJS_USE_NOT_FREE;
    if (STRCMP(token, TOKEN_FREE) != 0) { // free ?
        if (STRCMP(token, TOKEN_SECRET) != 0) { // not free, check token
            printf("t:%s\n", token);
            printf("t:%s\n", TOKEN_SECRET);
            printf("initMissile start FAILED, TOKEN ERROR\n");
            return NULL;
        }
    } else {
        free = H265WEBJS_USE_FREE;
    }

    printf("initMissile start OK\n");
    // send log
    //logRequest_sendVersion(version);

    VCodecContext *vcodecer = initVcodec();
    vcodecer->useFree = free;
    return vcodecer;
}

/*EMSCRIPTEN_KEEPALIVE int initMissile(VCodecContext *vcodecer) {
    //vcodecer = initVcodec();
    printf("initMissile done\n");

    if (vcodecer == NULL) {
        return -3;
    }
    return 0;
}*/

EMSCRIPTEN_KEEPALIVE int setCodecType(VCodecContext *vcodecer, CODEC_TYPE codecType, long callback) {
    return vcodecer->setCodecTypeFunc(vcodecer, codecType, callback);
}

EMSCRIPTEN_KEEPALIVE int exitMissile(VCodecContext *vcodecer) {
    int exitRet = exitVcodec(vcodecer);
    printf("VideoMissile exit done:%d\n",exitRet);

    return exitRet;
}

EMSCRIPTEN_KEEPALIVE int initializeDecoder(VCodecContext *vcodecer) {
    int initRet = vcodecer->initializeDecoderFunc(vcodecer);
    return initRet;
}

EMSCRIPTEN_KEEPALIVE int decodeCodecContext(VCodecContext *vcodecer, uint8_t *buff, int in_len, long pts, int flush) {
    int decodeRet = vcodecer->decodeCodecContextFunc(vcodecer, buff, in_len, pts, flush);
    return decodeRet;
}

//EMSCRIPTEN_KEEPALIVE
//ImageData *getFrame(VCodecContext *vcodecer) {
//    int getFrameRet = vcodecer->getFrameFunc(vcodecer);
//    return vcodecer->imageData;
//}

EMSCRIPTEN_KEEPALIVE int closeVideo(VCodecContext *vcodecer) {
    int closeRet = vcodecer->closeVideoFunc(vcodecer);
    return closeRet;
}

EMSCRIPTEN_KEEPALIVE int release(VCodecContext *vcodecer) {
    printf("release start\n");
    int releaseRet = vcodecer->releaseFunc(vcodecer);
    return releaseRet;
}

/*****************************************************************
 *
 *
 *
 *            2. TSDemuxer
 *
 *
 *
 *****************************************************************/

static int g_verify_mpegts_wasm_useful = 0;

// Global
TSBox *tsBox = NULL;

EMSCRIPTEN_KEEPALIVE int AVPlayerInit(const char *token, const char* version) {
    //if (STRCMP(token, TOKEN_SECRET) != 0) {
    //    printf("t:%s\n", token);
    //    printf("t:%s\n", TOKEN_SECRET);
    //    printf("initMissileHttp start FAILED, TOKEN ERROR\n");
    //    return NULL;
    //}
    if (STRCMP(token, TOKEN_FREE) != 0) {
        printf("t:%s\n", token);
        printf("t:%s\n", TOKEN_SECRET);
        printf("initMissile SniffStream start FAILED, TOKEN ERROR\n");
        return -1;
    }
    printf("initMissile AVPlayerInit start OK\n");

    if (g_verify_mpegts_wasm_useful <= 0) {
        g_verify_mpegts_wasm_useful = 1;
    }

    // send log
    //logRequest_sendVersion(version);
    return 0;
}



EMSCRIPTEN_KEEPALIVE
int initTsMissile() {
    if (g_verify_mpegts_wasm_useful <= 0) {
        return -1;
    }

    tsBox = initTSDemuxer();
    //printf("initMissile tsBox done\n");

    if (tsBox == NULL) {
        printf("initMissile tsBox failed\n");
        return -3;
    }
    return 0;
}

EMSCRIPTEN_KEEPALIVE
int exitTsMissile() {
    if (tsBox != NULL) {
        int exitRet = exitTSDemuxer(tsBox);
        if (exitRet != 0) {
            printf("VideoMissile exit tsBox WARNING maybe err:%d\n", exitRet);
        }
        free(tsBox);
        tsBox = NULL;
        return exitRet;
    }
    return 0;
}

/**
 * demuxer init
 * @param tsBox
// * @param type 0 265 1 264
 * @return
 */
EMSCRIPTEN_KEEPALIVE
int initializeDemuxer() {
    if (tsBox != NULL) {
        int initRet = tsBox->initializeDemuxerFunc(tsBox);
        return initRet;
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int demuxBox(uint8_t *buff, int in_len, int isLive) {
    if (tsBox != NULL) {
        int decodeRet = tsBox->demuxBoxFunc(tsBox, buff, in_len, isLive);
        return decodeRet;
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE
        MediaInfo *getMediaInfo() {
    if (tsBox != NULL) {
        // printf("duration: %f\n", tsBox->mediaInfo.v_duration);
        return &tsBox->mediaInfo;
    }
    return NULL;
}

EMSCRIPTEN_KEEPALIVE
        ExtensionInfo *getExtensionInfo() {
    return &tsBox->extensionInfo;
}

EMSCRIPTEN_KEEPALIVE
        uint32_t getVideoCodecID() {
    if (tsBox != NULL) {
        return tsmuxerUtilCodecTable(tsBox->v_codec);
    }
    return -1;
}

EMSCRIPTEN_KEEPALIVE
        uint32_t getAudioCodecID() {
    if (tsBox != NULL) {
        return tsmuxerUtilCodecTable(tsBox->a_codec);
    }
    return -1;
}

/*
 * Data Functions
 */
// resource packet
EMSCRIPTEN_KEEPALIVE PacketData *getPacket() {
    if (tsBox != NULL) {
        int getPacketRet = tsBox->getPacketFunc(tsBox);

        if (getPacketRet < 0) {
            return NULL;
        }
        return tsBox->packetData;
    }
    return NULL;
}

// VLC Layer
EMSCRIPTEN_KEEPALIVE uint32_t getVLCLen() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->VLCStreamLen;
        } else {
            return tsBox->avcCoder->VLCStreamLen;
        }
    } else {
        return -1;
    }
}

EMSCRIPTEN_KEEPALIVE uint8_t *getVLC() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            //for (int i = 0; i < tsBox->hevCoder->VLCStreamLen; i++) {
            //    printf("%d ", tsBox->hevCoder->VLCStream[i]);
            //}
            //printf("\n");
            return tsBox->hevCoder->VLCStream;
        } else {
            return tsBox->avcCoder->VLCStream;
        }
    } else {
        return NULL;
    }
}

// NALU Layer
EMSCRIPTEN_KEEPALIVE uint32_t getVPSLen() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.vpsLen;
        } else {
            return 0;
        }
    } else {
        return -1;
    }
}

EMSCRIPTEN_KEEPALIVE uint8_t *getVPS() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.naluVPS;
        } else {
            return NULL;
        }
    } else {
        return NULL;
    }
}

EMSCRIPTEN_KEEPALIVE uint32_t getSPSLen() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.spsLen;
        } else {
            return tsBox->avcCoder->naluHeader.spsLen;
        }
    } else {
        return -1;
    }
}

EMSCRIPTEN_KEEPALIVE uint8_t *getSPS() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.naluSPS;
        } else {
            return tsBox->avcCoder->naluHeader.naluSPS;
        }
    } else {
        return NULL;
    }
}

EMSCRIPTEN_KEEPALIVE uint32_t getPPSLen() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.ppsLen;
        } else {
            return tsBox->avcCoder->naluHeader.ppsLen;
        }
    } else {
        return 0;
    }
}

EMSCRIPTEN_KEEPALIVE uint8_t *getPPS() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.naluPPS;
        } else {
            return tsBox->avcCoder->naluHeader.naluPPS;
        }
    } else {
        return NULL;
    }
}

EMSCRIPTEN_KEEPALIVE uint32_t getSEILen() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.seiLen;
        } else {
            return tsBox->avcCoder->naluHeader.seiLen;
        }
    } else {
        return -1;
    }
}

EMSCRIPTEN_KEEPALIVE uint8_t *getSEI() {
    if (tsBox != NULL) {
        if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
            STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
            return tsBox->hevCoder->naluHeader.naluSEI;
        } else {
            return tsBox->avcCoder->naluHeader.naluSEI;
        }
    } else {
        return NULL;
    }
}


/* ****************************************************************
 *
 *
 *
 *             3.Full Demuxer+Decoder
 *
 *
 *
 * ****************************************************************/
EMSCRIPTEN_KEEPALIVE SniffStreamContext *AVSniffStreamInit(const char *token, const char* version) {
    //if (STRCMP(token, TOKEN_SECRET) != 0) {
    //    printf("t:%s\n", token);
    //    printf("t:%s\n", TOKEN_SECRET);
    //    printf("initMissileHttp start FAILED, TOKEN ERROR\n");
    //    return NULL;
    //}
    if (STRCMP(token, TOKEN_FREE) != 0) {
        printf("t:%s\n", token);
        printf("t:%s\n", TOKEN_SECRET);
        printf("initMissile SniffStream start FAILED, TOKEN ERROR\n");
        return NULL;
    }
    printf("initMissile SniffStream start OK\n");

    // send log
    //logRequest_sendVersion(version);

    SniffStreamContext *sniffStreamContext = newSniffStreamContext();
    return sniffStreamContext;
}

EMSCRIPTEN_KEEPALIVE int releaseSniffStream(SniffStreamContext *sniffStreamContext) {
    int exitRet = releaseSniffStreamContext(sniffStreamContext);
    printf("VideoMissileHttp exit done:%d\n", exitRet);
    return exitRet;
}


EMSCRIPTEN_KEEPALIVE int initializeSniffStreamModule(
        SniffStreamContext *sniffStreamContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        MISSILE_SNIFFSTREAM_MODE mode
) {
    int initRet = sniffStreamContext->initFunc(sniffStreamContext, mode);
    sniffStreamContext->setCodecTypeFunc(
            sniffStreamContext,
            (long) probeCallback, (long) yuvCallback, (long) naluCallback, (long) pcmCallback, (long) aacCallback, 0, 30);
    return initRet;
}

// void *myThread(void *arg) {
//     SniffStreamContext *sniffStreamContext = (SniffStreamContext *) arg;
//     EM_ASM(alert(111));
//     EM_ASM(
//             postMessage({cmd:"go"});
//     );
// } // myThread

EMSCRIPTEN_KEEPALIVE int initializeSniffStreamModuleWithAOpt(
        SniffStreamContext *sniffStreamContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        int ignoreAudio,
        MISSILE_SNIFFSTREAM_MODE mode,
        double defaultFps
) {
    int initRet = sniffStreamContext->initFunc(sniffStreamContext, mode);
    sniffStreamContext->setCodecTypeFunc(
            sniffStreamContext,
            (long) probeCallback, (long) yuvCallback, (long) naluCallback, (long) pcmCallback, (long) aacCallback,
            ignoreAudio, defaultFps);

    // pthread_t pt;
    // pthread_create(&pt, NULL, myThread, sniffStreamContext);

    return initRet;
}

EMSCRIPTEN_KEEPALIVE int pushSniffStreamData(
        SniffStreamContext *sniffStreamContext, uint8_t *buff, int in_len, int probe_size) {
    int pushRet = sniffStreamContext->pushBufferFunc(sniffStreamContext, buff, in_len, probe_size, 0);
    return pushRet;
}

EMSCRIPTEN_KEEPALIVE int getSniffStreamPkg(SniffStreamContext *sniffStreamContext) {
    int getRet = sniffStreamContext->getPacketFunc(sniffStreamContext, 1, 0);
    return getRet;
}

EMSCRIPTEN_KEEPALIVE int getSniffStreamPkgNoCheckProbe(SniffStreamContext *sniffStreamContext) {
    int getRet = sniffStreamContext->getPacketFunc(sniffStreamContext, 0, 0);
    return getRet;
}

EMSCRIPTEN_KEEPALIVE int decodeVideoFrame(
        SniffStreamContext *sniffStreamContext,
        uint8_t *buff, int len, long pts, long dts, int tag) {
    //printf("debug +++ EMSCRIPTEN_KEEPALIVE decodeVideoFrame pts:%d\n", pts);
    int decRet = sniffStreamContext->decodeVideoFrameFunc(
            sniffStreamContext, buff, len, pts, dts, tag, 0);
    return decRet;
}

EMSCRIPTEN_KEEPALIVE int naluLListLength(SniffStreamContext *sniffStreamContext) {
    int len = sniffStreamContext->naluLListLengthFunc(sniffStreamContext);
    return len;
}










/* ****************************************************************
 *
 *
 *
 *             4.Full HTTPFLV LIVE - Demuxer+Decoder
 *
 *
 *
 * ****************************************************************/
EMSCRIPTEN_KEEPALIVE SniffHTTPFLVContext *AVSniffHttpFlvInit(const char *token, const char* version) {
    if (STRCMP(token, TOKEN_FREE) != 0) {
        printf("t:%s\n", token);
        printf("t:%s\n", TOKEN_SECRET);
        printf("initMissile Sniff Http Flv start FAILED, TOKEN ERROR\n");
        return NULL;
    }
    printf("initMissile Sniff Http Flv start OK\n");

    SniffHTTPFLVContext *sniffHttpFlvContext = newSniffHTTPFLVContext();
    return sniffHttpFlvContext;
}

EMSCRIPTEN_KEEPALIVE int releaseSniffHttpFlv(SniffHTTPFLVContext *sniffHttpFlvContext) {
    int exitRet = releaseSniffHTTPFLVContext(sniffHttpFlvContext);
    printf("VideoMissileHttp exit done:%d\n", exitRet);
    return exitRet;
}


EMSCRIPTEN_KEEPALIVE int initializeSniffHttpFlvModule(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        int ignoreAudio
) {
    int initRet = sniffHttpFlvContext->initFunc(sniffHttpFlvContext, MISSILE_SNIFFSTREAM_MODE_LIVE);
    sniffHttpFlvContext->setCodecTypeFunc(
            sniffHttpFlvContext,
            (long) probeCallback, (long) yuvCallback, (long) naluCallback, (long) pcmCallback, (long) aacCallback, ignoreAudio);
    return initRet;
}

EMSCRIPTEN_KEEPALIVE int initializeSniffHttpFlvModuleWithAOpt(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        int ignoreAudio,
        MISSILE_SNIFFSTREAM_MODE mode
) {
    int initRet = sniffHttpFlvContext->initFunc(sniffHttpFlvContext, mode);
    sniffHttpFlvContext->setCodecTypeFunc(
            sniffHttpFlvContext,
            (long) probeCallback, (long) yuvCallback, (long) naluCallback, (long) pcmCallback, (long) aacCallback,
            ignoreAudio);
    return initRet;
}

EMSCRIPTEN_KEEPALIVE int pushSniffHttpFlvData(
        SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buff, int in_len, int probe_size) {
    int pushRet = sniffHttpFlvContext->pushBufferFunc(sniffHttpFlvContext, buff, in_len, probe_size);
    return pushRet;
}

// getBufferLength
EMSCRIPTEN_KEEPALIVE int getBufferLengthApi(SniffHTTPFLVContext *sniffHttpFlvContext)
{
    int getRet = sniffHttpFlvContext->getBufferLength(sniffHttpFlvContext);
    return getRet;
}

EMSCRIPTEN_KEEPALIVE int getSniffHttpFlvPkg(SniffHTTPFLVContext *sniffHttpFlvContext) {
    if (sniffHttpFlvContext == NULL) {
        printf("ERROR getSniffHttpFlvPkg ptr is NULL\n");
    }
    int getRet = sniffHttpFlvContext->getPacketFunc(sniffHttpFlvContext, 1);
    return getRet;
}

EMSCRIPTEN_KEEPALIVE int getSniffHttpFlvPkgNoCheckProbe(SniffHTTPFLVContext *sniffHttpFlvContext) {
    int getRet = sniffHttpFlvContext->getPacketFunc(sniffHttpFlvContext, 0);
    return getRet;
}

EMSCRIPTEN_KEEPALIVE int decodeHttpFlvVideoFrame(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        uint8_t *buff, int len, long pts, long dts, int tag) {
    //printf("debug +++ EMSCRIPTEN_KEEPALIVE decodeVideoFrame pts:%d\n", pts);
    int decRet = sniffHttpFlvContext->decodeVideoFrameFunc(
            sniffHttpFlvContext, buff, len, pts, dts, tag);
    return decRet;
}

EMSCRIPTEN_KEEPALIVE int releaseHttpFLV(SniffHTTPFLVContext *sniffHttpFlvContext) {
    printf("release http flv context start\n");
    int releaseRet = sniffHttpFlvContext->releaseFunc(sniffHttpFlvContext);
    return releaseRet;
}


/* ****************************************************************
 *
 *
 *
 *             4.Full G711 LIVE - Demuxer+Decoder
 *
 *
 *
 * ****************************************************************/
EMSCRIPTEN_KEEPALIVE SniffG711CoreContext *AVSniffHttpG711Init(const char *token, const char* version) {
    if (STRCMP(token, TOKEN_FREE) != 0) {
        printf("t:%s\n", token);
        printf("t:%s\n", TOKEN_SECRET);
        printf("initMissile Sniff Http G711 start FAILED, TOKEN ERROR\n");
        return NULL;
    }
    printf("initMissile Sniff Http G711 start OK\n");

    SniffG711CoreContext *sniffG711CoreContext = newSniffG711CoreContext();
    return sniffG711CoreContext;
}

EMSCRIPTEN_KEEPALIVE int initializeSniffG711Module(
        SniffG711CoreContext *sniffG711CoreContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*pcmCallback)(void),
        int ignoreAudio,
        MISSILE_SNIFFSTREAM_MODE mode
) {
    int initRet = sniffG711CoreContext->initFunc(sniffG711CoreContext, mode);
    sniffG711CoreContext->setCodecTypeFunc(
            sniffG711CoreContext,
            (long) probeCallback, (long) yuvCallback, (long) pcmCallback,
            ignoreAudio);

    return initRet;
}

EMSCRIPTEN_KEEPALIVE int pushSniffG711FlvData(
        SniffG711CoreContext *sniffG711CoreContext, uint8_t *buff, int in_len, int probe_size) {
    int pushRet = sniffG711CoreContext->pushBufferFunc(sniffG711CoreContext, buff, in_len, probe_size);
    return pushRet;
}

EMSCRIPTEN_KEEPALIVE int getG711BufferLengthApi(SniffG711CoreContext *sniffG711CoreContext)
{
    int getRet = sniffG711CoreContext->getBufferLength(sniffG711CoreContext);
    return getRet;
}

EMSCRIPTEN_KEEPALIVE int decodeG711Frame(SniffG711CoreContext *sniffG711CoreContext) {
    return sniffG711CoreContext->decodeVideoFrameFunc(sniffG711CoreContext);
}

EMSCRIPTEN_KEEPALIVE int releaseG711(SniffG711CoreContext *sniffG711CoreContext) {
    printf("release g711 context start\n");
    int releaseRet = sniffG711CoreContext->releaseFunc(sniffG711CoreContext);
    return releaseRet;
}





/************************************
 *
 *
 *
 *            main event
 *
 *
 *
 * **********************************/
int main() {
    printf("ext - h265web.js loaded!\n");
    IS_INTRODUCE_MINE = 0;
    //introduce_mine();
    //logRequest_sendVersionIncludeJS(H265WEBJS_VERSION);
    EM_ASM(
        if (typeof window != "undefined") {
            window.dispatchEvent(new CustomEvent("h265webjsWasmLoaded"))
        } else {
            // global.onWASMLoaded && global.onWASMLoaded()
            global.h265webjsWasmLoaded && global.h265webjsWasmLoaded()
        }
    );
    return EXIT_SUCCESS;
} // main
