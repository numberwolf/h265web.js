//
// Created by 小老虎 on 2020/8/29.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_HEVC_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_HEVC_H

#include <stdio.h>
#include <stdlib.h>
#include "const_codec.h"

//let naluVPS = _this.setStartCode(naluArr[0][0].data, false);
//let naluSPS = _this.setStartCode(naluArr[1][0].data, false);
//let naluPPS = _this.setStartCode(naluArr[2][0].data, false);
//let naluSEI = _this.setStartCode(naluArr[3][0].data, false);
typedef struct HEVCNaluHeader {
    uint32_t vpsLen;
    uint8_t *naluVPS;

    uint32_t spsLen;
    uint8_t *naluSPS;

    uint32_t ppsLen;
    uint8_t *naluPPS;

    uint32_t seiLen;
    uint8_t *naluSEI;

    uint32_t pushPtr; // NALU_TYPE_* when you make nalu data use it
    uint32_t pushStart; // NALU_TYPE_* when you make nalu data use it
} HEVCNaluHeader;

typedef struct HEVCoder {
    HEVCNaluHeader naluHeader;

    uint32_t keyFrame; // 0 unknow 1 keyframe 2 PB

    uint8_t *VLCStream;
    uint32_t VLCStreamLen;

    void (*handleFrame)(struct HEVCoder *hevCoder, uint8_t *packetStream, uint32_t packetStreamLen);
} HEVCoder;

HEVCoder* 	        initHEVCoder();
int32_t 			exitHEVCOder(HEVCoder *hevCoder);

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_HEVC_H
