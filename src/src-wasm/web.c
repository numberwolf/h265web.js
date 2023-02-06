//
// Created by 小老虎 on 2020/8/16.
//

//#include <emscripten.h>
#include "web.h"
#include "utils/ts_utils.h"
#include "ts_parser.h"

// Global
TSBox *tsBox = NULL;

//EMSCRIPTEN_KEEPALIVE
int initTsMissile() {
    tsBox = initTSDemuxer();
    //printf("initMissile tsBox done\n");

    if (tsBox == NULL) {
        printf("initMissile tsBox failed\n");
        return -3;
    }
    return 0;
}

//EMSCRIPTEN_KEEPALIVE
int exitTsMissile() {
    int exitRet = exitTSDemuxer(tsBox);
    printf("VideoMissile exit tsBox done:%d\n", exitRet);

    return exitRet;
}

//EMSCRIPTEN_KEEPALIVE //这个宏表示这个函数要作为导出的函数
int initializeDemuxer() {
    int initRet = tsBox->initializeDemuxerFunc(tsBox);
    return initRet;
}

//EMSCRIPTEN_KEEPALIVE //这个宏表示这个函数要作为导出的函数
int demuxBox(uint8_t *buff, int in_len) {
    int decodeRet = tsBox->demuxBoxFunc(tsBox, buff, in_len);
    return decodeRet;
}

MediaInfo *getMediaInfo() {
    return &tsBox->mediaInfo;
}

ExtensionInfo *getExtensionInfo() {
    return &tsBox->extensionInfo;
}

//EMSCRIPTEN_KEEPALIVE
uint32_t getVideoCodecID() {
    return tsmuxerUtilCodecTable(tsBox->v_codec);
}

//EMSCRIPTEN_KEEPALIVE
uint32_t getAudioCodecID() {
    return tsmuxerUtilCodecTable(tsBox->a_codec);
}


//EMSCRIPTEN_KEEPALIVE
PacketData *getPacket() {
    int getPacketRet = tsBox->getPacketFunc(tsBox);

    if (getPacketRet < 0) {
        return NULL;
    }
    return tsBox->packetData;
}

// VLC Layer
uint32_t getVLCLen() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->VLCStreamLen;
    } else {
        return tsBox->avcCoder->VLCStreamLen;
    }
}

uint8_t *getVLC() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->VLCStream;
    } else {
        return tsBox->avcCoder->VLCStream;
    }
}

// NALU Layer
uint32_t getVPSLen() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.vpsLen;
    } else {
        return 0;
    }
}

uint8_t *getVPS() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.naluVPS;
    } else {
        return NULL;
    }
}

uint32_t getSPSLen() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.spsLen;
    } else {
        return tsBox->avcCoder->naluHeader.spsLen;
    }
}

uint8_t *getSPS() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.naluSPS;
    } else {
        return tsBox->avcCoder->naluHeader.naluSPS;
    }
}

uint32_t getPPSLen() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.ppsLen;
    } else {
        return tsBox->avcCoder->naluHeader.ppsLen;
    }
}

uint8_t *getPPS() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.naluPPS;
    } else {
        return tsBox->avcCoder->naluHeader.naluPPS;
    }
}

uint32_t getSEILen() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.seiLen;
    } else {
        return tsBox->avcCoder->naluHeader.seiLen;
    }
}

uint8_t *getSEI() {
    if (STRCMP(tsBox->v_codec, DEF_HEVC_STRING) == 0 ||
        STRCMP(tsBox->v_codec, DEF_H265_STRING) == 0) {
        return tsBox->hevCoder->naluHeader.naluSEI;
    } else {
        return tsBox->avcCoder->naluHeader.naluSEI;
    }
}


