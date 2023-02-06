//
// Created by 小老虎 on 2020/8/30.
//

#include "avc.h"
#include <string.h>

#define NALU_SEARCH_LIMIT 10000


/**
 * remove aud
 * @param packetStream
 * @param packetStreamLen
 * @param returnLen
 * @return
 */
uint8_t *_avcRemoveAUD(uint8_t *packetStream, uint32_t packetStreamLen, uint32_t *returnLen) {
    if (packetStream == NULL) {
        printf("when remove aud, param can not be null\n");
        return NULL;
    }

    uint8_t *dst = NULL;
    uint32_t dstLen = 0;
    // target AUD
    if (packetStream[0] == AVC_AUD[0] && packetStream[1] == AVC_AUD[1] && packetStream[2] == AVC_AUD[2] &&
        packetStream[3] == AVC_AUD[3] && packetStream[4] == AVC_AUD[4]) {
        dstLen = packetStreamLen - 5;
        dst = (uint8_t *)malloc(sizeof(uint8_t) * dstLen);
        memcpy(dst, packetStream + 5, dstLen);

    } else if ( packetStream[1] == AVC_AUD[0] && packetStream[2] == AVC_AUD[1] && packetStream[3] == AVC_AUD[2] &&
                packetStream[4] == AVC_AUD[3] && packetStream[5] == AVC_AUD[4]) {
        dstLen = packetStreamLen - 6;
        dst = (uint8_t *)malloc(sizeof(uint8_t) * dstLen);
        memcpy(dst, packetStream + 6, dstLen);

    } else { // NO AUD
        dstLen = packetStreamLen;
        dst = (uint8_t *)malloc(sizeof(uint8_t) * packetStreamLen);
        // memory copy
        // dst src dstlen
        memcpy(dst, packetStream, packetStreamLen);
    }

    *returnLen = dstLen;
    return dst;
}

/**
 * full nalu header and get IBP type
 * @param avcCoder
 * @param index0
 * @param packetStream
 * @param u0
 * @param u1
 * @param u2
 * @param u3
 * @return NALU_TYPE
 */
NALU_TYPE _avcParseNaluHeaderGetType(
        AVCCoder *avcCoder,
        uint32_t index0, uint8_t *packetStream,
        uint8_t u0, uint8_t u1, uint8_t u2, uint8_t u3)
{
    if (u0 != SPLIT_SEQ[0] || u1 != SPLIT_SEQ[1] || u2 != SPLIT_SEQ[2]) {
        return NALU_TYPE_NULL;
    }
    //printf("check %d %d %d %d\n", u0, u1, u2, u3);

    /*
     * Full nalu header
     */
    if (NALU_TYPE_SPS == avcCoder->naluHeader.pushPtr) {
        avcCoder->naluHeader.spsLen = index0 - avcCoder->naluHeader.pushStart + 4;
        avcCoder->naluHeader.naluSPS = (uint8_t *) malloc(sizeof(uint8_t) * avcCoder->naluHeader.spsLen);
        memcpy(avcCoder->naluHeader.naluSPS, START_CODE, 4);
        memcpy(
                avcCoder->naluHeader.naluSPS + 4,
                packetStream + avcCoder->naluHeader.pushStart,
                avcCoder->naluHeader.spsLen - 4);

    } else if (NALU_TYPE_PPS == avcCoder->naluHeader.pushPtr) {
        avcCoder->naluHeader.ppsLen = index0 - avcCoder->naluHeader.pushStart + 4;
        avcCoder->naluHeader.naluPPS = (uint8_t *) malloc(sizeof(uint8_t) * avcCoder->naluHeader.ppsLen);
        memcpy(avcCoder->naluHeader.naluPPS, START_CODE, 4);
        memcpy(
                avcCoder->naluHeader.naluPPS + 4,
                packetStream + avcCoder->naluHeader.pushStart,
                avcCoder->naluHeader.ppsLen - 4);

    } else if (NALU_TYPE_SEI == avcCoder->naluHeader.pushPtr) {
        avcCoder->naluHeader.seiLen = index0 - avcCoder->naluHeader.pushStart + 4;
        avcCoder->naluHeader.naluSEI = (uint8_t *) malloc(sizeof(uint8_t) * avcCoder->naluHeader.seiLen);
        memcpy(avcCoder->naluHeader.naluSEI, START_CODE, 4);
        memcpy(
                avcCoder->naluHeader.naluSEI + 4,
                packetStream + avcCoder->naluHeader.pushStart,
                avcCoder->naluHeader.seiLen - 4);

    }

    /*
     * Check nalu type
     */
    NALU_TYPE nalu_type = NALU_TYPE_UNKN;

    // VPS
    if (u0 == AVC_NALU_SPS[0] && u1 == AVC_NALU_SPS[1] && u2 == AVC_NALU_SPS[2] &&
               u3 == AVC_NALU_SPS[3]) { // SPS
        avcCoder->naluHeader.pushPtr = NALU_TYPE_SPS;
        avcCoder->naluHeader.pushStart = index0 + 3; // 直接跳过 0x00 0x00 0x01 ，取body，然后自行填充 标准 00 00 00 01
        //printf("is nalu sps : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_SPS;

    } else if (u0 == AVC_NALU_PPS[0] && u1 == AVC_NALU_PPS[1] && u2 == AVC_NALU_PPS[2] &&
               u3 == AVC_NALU_PPS[3]) { // PPS
        avcCoder->naluHeader.pushPtr = NALU_TYPE_PPS;
        avcCoder->naluHeader.pushStart = index0 + 3;
        //printf("is nalu pps : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_PPS;

    } else if (u0 == AVC_NALU_SEI[0] && u1 == AVC_NALU_SEI[1] && u2 == AVC_NALU_SEI[2] &&
               u3 == AVC_NALU_SEI[3]) { // SEI
        avcCoder->naluHeader.pushPtr = NALU_TYPE_SEI;
        avcCoder->naluHeader.pushStart = index0 + 3;
        //printf("is nalu sei : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_SEI;

    } else {
        if (AVC_I_FRAME == u3) {
            //printf("is I Frame : %d %d %d %d\n", u0, u1, u2, u3);
            avcCoder->naluHeader.pushPtr = NALU_TYPE_I_F;
            avcCoder->naluHeader.pushStart = index0 + 3;
            nalu_type = NALU_TYPE_I_F;
        }

        if (AVC_PB_FRAME == u3) { // u2 == 0x01 &&
            //printf("is PB Frame : %d %d %d %d\n", u0, u1, u2, u3);
            avcCoder->naluHeader.pushPtr = NALU_TYPE_PB_F;
            avcCoder->naluHeader.pushStart = index0 + 3;
            nalu_type = NALU_TYPE_PB_F;
        }
    }

    return nalu_type;
}

/**
 * @TODO Get NALU
 * @param avcCoder
 * @param packetStream
 * @param packetStreamLen
 * @return
 */
uint8_t *_avcGetNaluVLCDesc(AVCCoder *avcCoder, uint8_t *packetStream, uint32_t packetStreamLen) {
    // check nalu type
    uint32_t limit = NALU_SEARCH_LIMIT > packetStreamLen ? packetStreamLen : NALU_SEARCH_LIMIT;

    // check data OK?
    if (limit > 4) {
        // search
        for (int i = 0; i < limit; i += 1) {
            // DEBUG
            //printf("loop data : %d %d %d %d(%d)\n",
            //        packetStream[i], packetStream[i + 1], packetStream[i + 2],
            //        packetStream[i + 3], GET_FRAME_TYPE_TAG(packetStream[i + 3]));

            NALU_TYPE naluType = _avcParseNaluHeaderGetType(
                    avcCoder,
                    i, packetStream,
                    packetStream[i], packetStream[i + 1], packetStream[i + 2], packetStream[i + 3]);

            // block: NO nalu
            if (NALU_TYPE_NULL == naluType) {
                continue;
            } else if (NALU_TYPE_UNKN == naluType) {
                continue;
            } else if (NALU_TYPE_SPS == naluType) { // Nalu header Content
                continue;
            } else if (NALU_TYPE_PPS == naluType) { // Nalu header Content
                continue;
            } else if (NALU_TYPE_SEI == naluType) { // Nalu header Content
                continue;
            } else {
                // Frame Content
                if (NALU_TYPE_I_F == naluType) {
                    avcCoder->VLCStreamLen = packetStreamLen - i - 3 + 4;
                    avcCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * avcCoder->VLCStreamLen);

                    memcpy(avcCoder->VLCStream, START_CODE, 4);
                    memcpy(avcCoder->VLCStream + 4, packetStream + i + 3, avcCoder->VLCStreamLen - 4);

                    avcCoder->keyFrame = 1;

                    //avcCoder->VLCStreamLen = packetStreamLen - i;
                    //avcCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * avcCoder->VLCStreamLen);
                    //memcpy(avcCoder->VLCStream, packetStream + i, avcCoder->VLCStreamLen);
                    //
                    //avcCoder->keyFrame = 1;

                } else if (NALU_TYPE_PB_F == naluType) {
                    avcCoder->VLCStreamLen = packetStreamLen - i - 3 + 4;
                    avcCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * avcCoder->VLCStreamLen);

                    memcpy(avcCoder->VLCStream, START_CODE, 4);
                    memcpy(avcCoder->VLCStream + 4, packetStream + i + 3, avcCoder->VLCStreamLen - 4);

                    avcCoder->keyFrame = 2;

                    //avcCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * packetStreamLen);
                    //memcpy(avcCoder->VLCStream, packetStream, packetStreamLen);
                    //
                    //avcCoder->keyFrame = 2;
                    //avcCoder->VLCStreamLen = packetStreamLen;

                } else {
                    continue;
                }

                // if find I PB Frame, return
                return avcCoder->VLCStream;
            }
        } // end for
    } // end if limit > 4

    // Not match any Frame , return dist from source
    avcCoder->VLCStream = (uint8_t *)malloc(sizeof(uint8_t) * packetStreamLen);
    memcpy(avcCoder->VLCStream, packetStream, packetStreamLen);
    avcCoder->keyFrame = 0;
    avcCoder->VLCStreamLen = packetStreamLen;

    return avcCoder->VLCStream;
}

void _avcReleaseAVCCoderContext(AVCCoder *avcCoder) {
    if (avcCoder->naluHeader.naluSPS != NULL) {
        free(avcCoder->naluHeader.naluSPS);
        avcCoder->naluHeader.naluSPS = NULL;
    }

    if (avcCoder->naluHeader.naluPPS != NULL) {
        free(avcCoder->naluHeader.naluPPS);
        avcCoder->naluHeader.naluPPS = NULL;
    }

    if (avcCoder->naluHeader.naluSEI != NULL) {
        free(avcCoder->naluHeader.naluSEI);
        avcCoder->naluHeader.naluSEI = NULL;
    }

    avcCoder->naluHeader.spsLen     = 0;
    avcCoder->naluHeader.ppsLen     = 0;
    avcCoder->naluHeader.seiLen     = 0;
    avcCoder->naluHeader.pushPtr    = NALU_TYPE_NULL;
    avcCoder->naluHeader.pushStart  = 0;

    avcCoder->keyFrame = 0; // 0 unknow 1 keyframe 2 PB
    if (avcCoder->VLCStream != NULL) {
        free(avcCoder->VLCStream);
        avcCoder->VLCStream = NULL;
    }
    avcCoder->VLCStreamLen = 0;
}

/**
 * Get playPacket, get frame type
 * @param avcCoder
 * @param packetStream
 * @param packetStreamLen
 */
void avcHandleFrame(AVCCoder *avcCoder, uint8_t *packetStream, uint32_t packetStreamLen) {
    _avcReleaseAVCCoderContext(avcCoder);

    // remove aud
    uint32_t streamLen = 0;
    uint8_t *stream = _avcRemoveAUD(packetStream, packetStreamLen, &streamLen);
    _avcGetNaluVLCDesc(avcCoder, stream, streamLen);
//    _getNaluVLCDesc(avcCoder, packetStream, packetStreamLen);
}

/**
 * main
 */
AVCCoder* initAVCCoder() {
    AVCCoder *avcCoder = (AVCCoder *)malloc(sizeof(AVCCoder));
    avcCoder->naluHeader.naluSPS = NULL;
    avcCoder->naluHeader.naluPPS = NULL;
    avcCoder->naluHeader.naluSEI = NULL;

    avcCoder->keyFrame = 0;
    avcCoder->VLCStream = NULL;
    avcCoder->VLCStreamLen = 0;

    avcCoder->handleFrame = avcHandleFrame;
    _avcReleaseAVCCoderContext(avcCoder);

    return avcCoder;
}

int32_t exitAVCCOder(AVCCoder *avcCoder) {
    if (avcCoder == NULL) {
        return -1;
    }
    avcCoder->handleFrame = NULL;
    _avcReleaseAVCCoderContext(avcCoder);

    return 0;
}



