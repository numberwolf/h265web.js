//
// Created by 小老虎 on 2020/8/29.
//

#include "hevc.h"
#include <string.h>

#define GET_FRAME_TYPE_TAG(x) ((x & 0x7E) >> 1)
#define NALU_SEARCH_LIMIT 10000

/**
 * remove aud
 * @param packetStream
 * @param packetStreamLen
 * @param returnLen
 * @return
 */
uint8_t *_removeAUD(uint8_t *packetStream, uint32_t packetStreamLen, uint32_t *returnLen) {
    if (packetStream == NULL) {
        //printf("when remove aud, param can not be null\n");
        return NULL;
    }

    uint8_t *dst = NULL;
    uint32_t dstLen = 0;
    // target AUD
    if (packetStream[0] == HEVC_AUD[0] && packetStream[1] == HEVC_AUD[1] && packetStream[2] == HEVC_AUD[2] &&
        packetStream[3] == HEVC_AUD[3] && packetStream[4] == HEVC_AUD[4] && packetStream[5] == HEVC_AUD[5]) {
        dstLen = packetStreamLen - 6;
        dst = (uint8_t *)malloc(sizeof(uint8_t) * dstLen);
        memcpy(dst, packetStream + 6, dstLen);

    } else if ( packetStream[1] == HEVC_AUD[0] && packetStream[2] == HEVC_AUD[1] && packetStream[3] == HEVC_AUD[2] &&
                packetStream[4] == HEVC_AUD[3] && packetStream[5] == HEVC_AUD[4] && packetStream[6] == HEVC_AUD[5]) {
        dstLen = packetStreamLen - 7;
        dst = (uint8_t *)malloc(sizeof(uint8_t) * dstLen);
        memcpy(dst, packetStream + 7, dstLen);

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
 * @param hevCoder
 * @param index0
 * @param packetStream
 * @param u0
 * @param u1
 * @param u2
 * @param u3
 * @return NALU_TYPE
 */
NALU_TYPE _parseNaluHeaderGetType(
        HEVCoder *hevCoder,
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
    if (NALU_TYPE_VPS == hevCoder->naluHeader.pushPtr) {
        // 0 1 2 3 4
        hevCoder->naluHeader.vpsLen = index0 - hevCoder->naluHeader.pushStart + 4;
        hevCoder->naluHeader.naluVPS = (uint8_t *) malloc(sizeof(uint8_t) * hevCoder->naluHeader.vpsLen);
        memcpy(hevCoder->naluHeader.naluVPS, START_CODE, 4);
        memcpy(
                hevCoder->naluHeader.naluVPS + 4,
                packetStream + hevCoder->naluHeader.pushStart,
                hevCoder->naluHeader.vpsLen - 4);

    } else if (NALU_TYPE_SPS == hevCoder->naluHeader.pushPtr) {
        hevCoder->naluHeader.spsLen = index0 - hevCoder->naluHeader.pushStart + 4;
        hevCoder->naluHeader.naluSPS = (uint8_t *) malloc(sizeof(uint8_t) * hevCoder->naluHeader.spsLen);
        memcpy(hevCoder->naluHeader.naluSPS, START_CODE, 4);
        memcpy(
                hevCoder->naluHeader.naluSPS + 4,
                packetStream + hevCoder->naluHeader.pushStart,
                hevCoder->naluHeader.spsLen - 4);

    } else if (NALU_TYPE_PPS == hevCoder->naluHeader.pushPtr) {
        hevCoder->naluHeader.ppsLen = index0 - hevCoder->naluHeader.pushStart + 4;
        hevCoder->naluHeader.naluPPS = (uint8_t *) malloc(sizeof(uint8_t) * hevCoder->naluHeader.ppsLen);
        memcpy(hevCoder->naluHeader.naluPPS, START_CODE, 4);
        memcpy(
                hevCoder->naluHeader.naluPPS + 4,
                packetStream + hevCoder->naluHeader.pushStart,
                hevCoder->naluHeader.ppsLen - 4);

    } else if (NALU_TYPE_SEI == hevCoder->naluHeader.pushPtr) {
        hevCoder->naluHeader.seiLen = index0 - hevCoder->naluHeader.pushStart + 4;
        hevCoder->naluHeader.naluSEI = (uint8_t *) malloc(sizeof(uint8_t) * hevCoder->naluHeader.seiLen);
        memcpy(hevCoder->naluHeader.naluSEI, START_CODE, 4);
        memcpy(
                hevCoder->naluHeader.naluSEI + 4,
                packetStream + hevCoder->naluHeader.pushStart,
                hevCoder->naluHeader.seiLen - 4);

    }

    /*
     * Check nalu type
     */
    NALU_TYPE nalu_type = NALU_TYPE_UNKN;

    // VPS
    if (u0 == HEVC_NALU_VPS[0] && u1 == HEVC_NALU_VPS[1] && u2 == HEVC_NALU_VPS[2] &&
        u3 == HEVC_NALU_VPS[3]) {
        hevCoder->naluHeader.pushPtr = NALU_TYPE_VPS;
        hevCoder->naluHeader.pushStart = index0 + 3; // 直接跳过 0x00 0x00 0x01 ，取body，然后自行填充 标准 00 00 00 01
        //printf("is nalu vps : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_VPS;
    } else if (u0 == HEVC_NALU_SPS[0] && u1 == HEVC_NALU_SPS[1] && u2 == HEVC_NALU_SPS[2] &&
        u3 == HEVC_NALU_SPS[3]) { // SPS
        hevCoder->naluHeader.pushPtr = NALU_TYPE_SPS;
        hevCoder->naluHeader.pushStart = index0 + 3;
        //printf("is nalu sps : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_SPS;
    } else if (u0 == HEVC_NALU_PPS[0] && u1 == HEVC_NALU_PPS[1] && u2 == HEVC_NALU_PPS[2] &&
        u3 == HEVC_NALU_PPS[3]) { // PPS
        hevCoder->naluHeader.pushPtr = NALU_TYPE_PPS;
        hevCoder->naluHeader.pushStart = index0 + 3;
        //printf("is nalu pps : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_PPS;
    } else if (u0 == HEVC_NALU_SEI[0] && u1 == HEVC_NALU_SEI[1] && u2 == HEVC_NALU_SEI[2] &&
        u3 == HEVC_NALU_SEI[3]) { // SEI
        hevCoder->naluHeader.pushPtr = NALU_TYPE_SEI;
        hevCoder->naluHeader.pushStart = index0 + 3;
        //printf("is nalu sei : %d %d %d %d\n", u0, u1, u2, u3);
        nalu_type = NALU_TYPE_SEI;

    } else {

        // I Frame
        //GET_NALU_TYPE       : (charByte) => {
        //    let type = (charByte & 0x7E) >> 1;
        //    if (type >= 1 && type <= 9) {
        //        return HevHeader.DEFINE_P_FRAME;
        //    } else if (type >= 16 && type <= 21) {
        //        return HevHeader.DEFINE_KEY_FRAME;
        //    } else {
        //        let typeInfo = DEFINE_HEV_PS.indexOf(type);
        //        if (typeInfo > 0) {
        //            return typeInfo;
        //        } else {
        //            return HevHeader.DEFINE_OTHERS_FRAME;
        //        }
        //    }
        //}
        for (int i = 0; i < 6; i++) {
            if (HEVC_I_FRAME_DEF[i] == GET_FRAME_TYPE_TAG(u3)) {
                //printf("is I Frame : %d %d %d %d\n", u0, u1, u2, u3);
                hevCoder->naluHeader.pushPtr = NALU_TYPE_I_F;
                hevCoder->naluHeader.pushStart = index0 + 3;
                nalu_type = NALU_TYPE_I_F;
            }
        }

        for (int i = 0; i < 9; i++) {
            if (HEVC_PB_FRAME_DEF[i] == GET_FRAME_TYPE_TAG(u3)) { // u2 == 0x01 &&
                //printf("is PB Frame : %d %d %d %d\n", u0, u1, u2, u3);
                hevCoder->naluHeader.pushPtr = NALU_TYPE_PB_F;
                hevCoder->naluHeader.pushStart = index0 + 3;
                nalu_type = NALU_TYPE_PB_F;
            }
        }
    }

    return nalu_type;
}

/**
 * @TODO Get NALU
 * @param hevCoder
 * @param packetStream
 * @param packetStreamLen
 * @return
 */
uint8_t *_getNaluVLCDesc(HEVCoder *hevCoder, uint8_t *packetStream, uint32_t packetStreamLen)
{
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

            NALU_TYPE naluType = _parseNaluHeaderGetType(
                    hevCoder,
                    i, packetStream,
                    packetStream[i], packetStream[i + 1], packetStream[i + 2], packetStream[i + 3]);

            // block: NO nalu
            if (NALU_TYPE_NULL == naluType) {
                continue;
            } else if (NALU_TYPE_UNKN == naluType) {
                continue;
            } else if (NALU_TYPE_VPS == naluType) { // Nalu header Content
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
                    // len: 7
                    // 0  1  2  3  4  5  6
                    // 00 00 00 01 64 11 22
                    hevCoder->VLCStreamLen = packetStreamLen - i - 3 + 4;
                    hevCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * hevCoder->VLCStreamLen);

                    memcpy(hevCoder->VLCStream, START_CODE, 4);
                    memcpy(hevCoder->VLCStream + 4, packetStream + i + 3, hevCoder->VLCStreamLen - 4);

                    hevCoder->keyFrame = 1;
                    //printf("====>\n%d %d %d %d : \n%d, %d, %d: \n%d %d %d %d %d <<<\n",
                    //       packetStream[i], packetStream[i+1], packetStream[i+2], packetStream[i+3],
                    //       i + 3, packetStreamLen, hevCoder->VLCStreamLen,
                    //       hevCoder->VLCStream[0], hevCoder->VLCStream[1], hevCoder->VLCStream[2], hevCoder->VLCStream[3],
                    //       hevCoder->VLCStream[4]);
                    //
                    //for (int j = 0; j < hevCoder->VLCStreamLen; ++j) {
                    //    printf("%d ", hevCoder->VLCStream[j]);
                    //}
                    //printf("\n");

                } else if (NALU_TYPE_PB_F == naluType) {
                    //hevCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * packetStreamLen);
                    //memcpy(hevCoder->VLCStream, START_CODE, 4);
                    //memcpy(hevCoder->VLCStream + 4, packetStream, packetStreamLen);
                    //
                    //hevCoder->keyFrame = 2;
                    //hevCoder->VLCStreamLen = packetStreamLen;
                    hevCoder->VLCStreamLen = packetStreamLen - i - 3 + 4;
                    hevCoder->VLCStream = (uint8_t *) malloc(sizeof(uint8_t) * hevCoder->VLCStreamLen);

                    memcpy(hevCoder->VLCStream, START_CODE, 4);
                    memcpy(hevCoder->VLCStream + 4, packetStream + i + 3, hevCoder->VLCStreamLen - 4);

                    hevCoder->keyFrame = 2;
                    //printf("====>\n%d %d %d %d : \n%d, %d, %d: \n%d %d %d %d %d <<<\n",
                    //       packetStream[i], packetStream[i+1], packetStream[i+2], packetStream[i+3],
                    //       i + 3, packetStreamLen, hevCoder->VLCStreamLen,
                    //       hevCoder->VLCStream[0], hevCoder->VLCStream[1], hevCoder->VLCStream[2], hevCoder->VLCStream[3],
                    //       hevCoder->VLCStream[4]);
                    //
                    //for (int j = 0; j < hevCoder->VLCStreamLen; ++j) {
                    //    printf("%d ", hevCoder->VLCStream[j]);
                    //}
                    //printf("\n");

                } else {
                    continue;
                }

                // if find I PB Frame, return
                return hevCoder->VLCStream;
            }
        } // end for
    } // end if limit > 4

    // Not match any Frame , return dist from source
    hevCoder->VLCStream = (uint8_t *)malloc(sizeof(uint8_t) * packetStreamLen);
    memcpy(hevCoder->VLCStream, packetStream, packetStreamLen);
    hevCoder->keyFrame = 0;
    hevCoder->VLCStreamLen = packetStreamLen;

    return hevCoder->VLCStream;
}

void _releaseHEVCoderContext(HEVCoder *hevCoder) {
    if (hevCoder->naluHeader.naluVPS != NULL) {
        free(hevCoder->naluHeader.naluVPS);
        hevCoder->naluHeader.naluVPS = NULL;
    }

    if (hevCoder->naluHeader.naluSPS != NULL) {
        free(hevCoder->naluHeader.naluSPS);
        hevCoder->naluHeader.naluSPS = NULL;
    }

    if (hevCoder->naluHeader.naluPPS != NULL) {
        free(hevCoder->naluHeader.naluPPS);
        hevCoder->naluHeader.naluPPS = NULL;
    }

    if (hevCoder->naluHeader.naluSEI != NULL) {
        free(hevCoder->naluHeader.naluSEI);
        hevCoder->naluHeader.naluSEI = NULL;
    }

    hevCoder->naluHeader.vpsLen     = 0;
    hevCoder->naluHeader.spsLen     = 0;
    hevCoder->naluHeader.ppsLen     = 0;
    hevCoder->naluHeader.seiLen     = 0;
    hevCoder->naluHeader.pushPtr    = NALU_TYPE_NULL;
    hevCoder->naluHeader.pushStart  = 0;

    hevCoder->keyFrame = 0; // 0 unknow 1 keyframe
    //printf("len : %d\n", hevCoder->VLCStreamLen);
    if (hevCoder->VLCStreamLen > 0 && hevCoder->VLCStream != NULL) {
        free(hevCoder->VLCStream);
        hevCoder->VLCStream = NULL;
    }
    hevCoder->VLCStreamLen = 0;
}

/**
 * Get playPacket, get frame type
 * @param hevCoder
 * @param packetStream
 * @param packetStreamLen
 */
void handleFrame(HEVCoder *hevCoder, uint8_t *packetStream, uint32_t packetStreamLen) {
    _releaseHEVCoderContext(hevCoder);

    // remove aud
    uint32_t streamLen = 0;
    uint8_t *stream = _removeAUD(packetStream, packetStreamLen, &streamLen);
    _getNaluVLCDesc(hevCoder, stream, streamLen);
    //_getNaluVLCDesc(hevCoder, packetStream, packetStreamLen);
}

/**
 * main
 */
HEVCoder* initHEVCoder() {
    HEVCoder *hevCoder = (HEVCoder *)malloc(sizeof(HEVCoder));
    hevCoder->naluHeader.naluVPS = NULL;
    hevCoder->naluHeader.naluSPS = NULL;
    hevCoder->naluHeader.naluPPS = NULL;
    hevCoder->naluHeader.naluSEI = NULL;

    hevCoder->keyFrame = 0;
    hevCoder->VLCStream = NULL;
    hevCoder->VLCStreamLen = 0;

    hevCoder->handleFrame = handleFrame;
    _releaseHEVCoderContext(hevCoder);

    return hevCoder;
}

int32_t exitHEVCOder(HEVCoder *hevCoder) {
    if (hevCoder == NULL) {
        return -1;
    }
    hevCoder->handleFrame = NULL;
    _releaseHEVCoderContext(hevCoder);

    return 0;
}


