//#include <emscripten.h>
//#include <wasm_simd128.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#include "web_capi.h"

/*#include "utils/common_string.h"
#include "utils/secret.h"
#include "utils/tools.h"
#include "utils/ts_utils.h"

#include "vcodec.h"
#include "ts_parser.h"
#include "sniff_stream.h"
#include "sniff_httpflv.h"
#include "sniff_g711core.h"*/

/*#ifdef __EMSCRIPTEN__
#include <emscripten/fetch.h>
#include <emscripten.h>
#endif*/


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

/*void logRequest_downloadSucceeded(emscripten_fetch_t *fetch) {
    //printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
    // The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
    for (size_t i = 0; i < fetch->numBytes; ++i) {
        printf("%c", fetch->data[i]);
    }
    printf("\n");
    emscripten_fetch_close(fetch); // Free data associated with the fetch.
}*/

/*void logRequest_downloadFailed(emscripten_fetch_t *fetch) {
    //printf("Downloading %s failed, HTTP failure status code: %d.\n", fetch->url, fetch->status);
    emscripten_fetch_close(fetch); // Also free data on failure.
}*/


/*int logRequest_sendVersion(const char* version) {
    emscripten_fetch_attr_t attr;
    emscripten_fetch_attr_init(&attr);
    strcpy(attr.requestMethod, "GET");
    attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
    attr.onsuccess = logRequest_downloadSucceeded;
    attr.onerror = logRequest_downloadFailed;

    char requestURI[256];

    long nowTimestamp = getTimestampSec();
    int randomKey = getRandom(RANDOM_MAX);
    char randomKeyStr[5];
    sprintf(randomKeyStr, "%ld%d", nowTimestamp % SIGN_INT_SPLIT_BASE, randomKey % SIGN_INT_SPLIT_BASE);

    // 这里返回的const char*必须先接住才行
    char sign[33];
    strcpy(sign, encryptMd5(randomKeyStr, SIGN_INT_SPLIT_BASE_LEN + SIGN_INT_SPLIT_BASE_LEN));

    //sprintf(
    //        requestURI,
    //        "http://apih265webjs.yuveye.com/?"
    //        "c=log&a=version"
    //        "&version=%s&key1=%ld&key2=%d&sign=%s",
    //        version,
    //        nowTimestamp,
    //        randomKey,
    //        sign);
    sprintf(
            requestURI,
            "https://www.zzsin.com/eye/user/anchor/anchor?"
            "type=info&app=h265web&page=player&block=player&action=build&info=version=%s;timestamp=%ld",
            version,
            nowTimestamp);

    //emscripten_fetch(&attr, "http://apih265webjs.yuveye.com/?c=domainLimit&a=check&t=123124214124");
    emscripten_fetch(&attr, requestURI);
    printf("[v] all ok now\n");
    return 0;
}*/







/* ****************************************************************
 *
 *
 *
 *             1.Decoder
 *
 *
 *
 * ****************************************************************/

VCodecContext *registerPlayer(const char *token, const char* version) {
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

int initMissile(VCodecContext *vcodecer) {
    //vcodecer = initVcodec();
    printf("initMissile done\n");

    if (vcodecer == NULL) {
        return -3;
    }
    return 0;
}

int setCodecType(VCodecContext *vcodecer, CODEC_TYPE codecType, long callback) {
    return vcodecer->setCodecTypeFunc(vcodecer, codecType, callback);
}

int exitMissile(VCodecContext *vcodecer) {
    int exitRet = exitVcodec(vcodecer);
    printf("VideoMissile exit done:%d\n",exitRet);

    return exitRet;
}

int initializeDecoder(VCodecContext *vcodecer) {
    int initRet = vcodecer->initializeDecoderFunc(vcodecer);
    return initRet;
}

int decodeCodecContext(VCodecContext *vcodecer, uint8_t *buff, int in_len, long pts, int flush) {
    int decodeRet = vcodecer->decodeCodecContextFunc(vcodecer, buff, in_len, pts, flush);
    return decodeRet;
}

//ImageData *getFrame(VCodecContext *vcodecer) {
//    int getFrameRet = vcodecer->getFrameFunc(vcodecer);
//    return vcodecer->imageData;
//}

int closeVideo(VCodecContext *vcodecer) {
    int closeRet = vcodecer->closeVideoFunc(vcodecer);
    return closeRet;
}

int release(VCodecContext *vcodecer) {
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

// Global
TSBox *tsBox = NULL;

int initTsMissile() {
    tsBox = initTSDemuxer();
    //printf("initMissile tsBox done\n");

    if (tsBox == NULL) {
        printf("initMissile tsBox failed\n");
        return -3;
    }
    return 0;
}

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
int initializeDemuxer() {
    if (tsBox != NULL) {
        int initRet = tsBox->initializeDemuxerFunc(tsBox);
        return initRet;
    }
    return -1;
}

int demuxBox(uint8_t *buff, int in_len, int isLive) {
    if (tsBox != NULL) {
        int decodeRet = tsBox->demuxBoxFunc(tsBox, buff, in_len, isLive);
        return decodeRet;
    }
    return -1;
}

MediaInfo *getMediaInfo() {
    if (tsBox != NULL) {
        // printf("duration: %f\n", tsBox->mediaInfo.v_duration);
        return &tsBox->mediaInfo;
    }
    return NULL;
}

ExtensionInfo *getExtensionInfo() {
    return &tsBox->extensionInfo;
}

uint32_t getVideoCodecID() {
    if (tsBox != NULL) {
        return tsmuxerUtilCodecTable(tsBox->v_codec);
    }
    return -1;
}

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
PacketData *getPacket() {
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
uint32_t getVLCLen() {
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

uint8_t *getVLC() {
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
uint32_t getVPSLen() {
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

uint8_t *getVPS() {
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

uint32_t getSPSLen() {
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

uint8_t *getSPS() {
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

uint32_t getPPSLen() {
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

uint8_t *getPPS() {
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

uint32_t getSEILen() {
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

uint8_t *getSEI() {
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
SniffStreamContext *AVSniffStreamInit(const char *token, const char* version) {
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

int releaseSniffStream(SniffStreamContext *sniffStreamContext) {
    int exitRet = releaseSniffStreamContext(sniffStreamContext);
    printf("VideoMissileHttp exit done:%d\n", exitRet);
    return exitRet;
}


int initializeSniffStreamModule(
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

int initializeSniffStreamModuleWithAOpt(
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

int pushSniffStreamData(
        SniffStreamContext *sniffStreamContext, uint8_t *buff, int in_len, int probe_size) {
    int pushRet = sniffStreamContext->pushBufferFunc(sniffStreamContext, buff, in_len, probe_size, 0);
    return pushRet;
}

int getSniffStreamPkg(SniffStreamContext *sniffStreamContext) {
    int getRet = sniffStreamContext->getPacketFunc(sniffStreamContext, 1, 0);
    return getRet;
}

int getSniffStreamPkgNoCheckProbe(SniffStreamContext *sniffStreamContext) {
    int getRet = sniffStreamContext->getPacketFunc(sniffStreamContext, 0, 0);
    return getRet;
}

int decodeVideoFrame(
        SniffStreamContext *sniffStreamContext,
        uint8_t *buff, int len, long pts, long dts, int tag) {
    //printf("debug +++ decodeVideoFrame pts:%d\n", pts);
    int decRet = sniffStreamContext->decodeVideoFrameFunc(
            sniffStreamContext, buff, len, pts, dts, tag, 0);
    return decRet;
}

int naluLListLength(SniffStreamContext *sniffStreamContext) {
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
SniffHTTPFLVContext *AVSniffHttpFlvInit(const char *token, const char* version) {
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

int releaseSniffHttpFlv(SniffHTTPFLVContext *sniffHttpFlvContext) {
    int exitRet = releaseSniffHTTPFLVContext(sniffHttpFlvContext);
    printf("VideoMissileHttp exit done:%d\n", exitRet);
    return exitRet;
}


int initializeSniffHttpFlvModule(
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

int initializeSniffHttpFlvModuleWithAOpt(
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

int pushSniffHttpFlvData(
        SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buff, int in_len, int probe_size) {
    int pushRet = sniffHttpFlvContext->pushBufferFunc(sniffHttpFlvContext, buff, in_len, probe_size);
    return pushRet;
}

// getBufferLength
int getBufferLengthApi(SniffHTTPFLVContext *sniffHttpFlvContext)
{
    int getRet = sniffHttpFlvContext->getBufferLength(sniffHttpFlvContext);
    return getRet;
}

int getSniffHttpFlvPkg(SniffHTTPFLVContext *sniffHttpFlvContext) {
    if (sniffHttpFlvContext == NULL) {
        printf("ERROR getSniffHttpFlvPkg ptr is NULL\n");
    }
    int getRet = sniffHttpFlvContext->getPacketFunc(sniffHttpFlvContext, 1);
    return getRet;
}

int getSniffHttpFlvPkgNoCheckProbe(SniffHTTPFLVContext *sniffHttpFlvContext) {
    int getRet = sniffHttpFlvContext->getPacketFunc(sniffHttpFlvContext, 0);
    return getRet;
}

int decodeHttpFlvVideoFrame(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        uint8_t *buff, int len, long pts, long dts, int tag) {
    //printf("debug +++ decodeVideoFrame pts:%d\n", pts);
    int decRet = sniffHttpFlvContext->decodeVideoFrameFunc(
            sniffHttpFlvContext, buff, len, pts, dts, tag);
    return decRet;
}

int releaseHttpFLV(SniffHTTPFLVContext *sniffHttpFlvContext) {
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
SniffG711CoreContext *AVSniffHttpG711Init(const char *token, const char* version) {
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

int initializeSniffG711Module(
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

int pushSniffG711FlvData(
        SniffG711CoreContext *sniffG711CoreContext, uint8_t *buff, int in_len, int probe_size) {
    int pushRet = sniffG711CoreContext->pushBufferFunc(sniffG711CoreContext, buff, in_len, probe_size);
    return pushRet;
}

int getG711BufferLengthApi(SniffG711CoreContext *sniffG711CoreContext)
{
    int getRet = sniffG711CoreContext->getBufferLength(sniffG711CoreContext);
    return getRet;
}

int decodeG711Frame(SniffG711CoreContext *sniffG711CoreContext) {
    return sniffG711CoreContext->decodeVideoFrameFunc(sniffG711CoreContext);
}

int releaseG711(SniffG711CoreContext *sniffG711CoreContext) {
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
/*int main() {
    printf("wasm main\n");
    EM_ASM(
        if (typeof window != "undefined") {
            window.dispatchEvent(new CustomEvent("wasmLoaded"))
        } else {
            // global.onWASMLoaded && global.onWASMLoaded()
        }
    );
    return EXIT_SUCCESS;
}*/ // main
