//
// Created by 小老虎 on 2020/8/30.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_AVC_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_AVC_H

#include <stdio.h>
#include <stdlib.h>
#include "const_codec.h"

typedef struct AVCNaluHeader {
    uint32_t spsLen;
    uint8_t *naluSPS;

    uint32_t ppsLen;
    uint8_t *naluPPS;

    uint32_t seiLen;
    uint8_t *naluSEI;

    uint32_t pushPtr; // NALU_TYPE_* when you make nalu data use it
    uint32_t pushStart; // NALU_TYPE_* when you make nalu data use it
} AVCNaluHeader;

typedef struct AVCCoder {
    AVCNaluHeader naluHeader;

    uint32_t keyFrame; // 0 unknow 1 keyframe 2 PB

    uint8_t *VLCStream;
    uint32_t VLCStreamLen;

    void (*handleFrame)(struct AVCCoder *avcCoder, uint8_t *packetStream, uint32_t packetStreamLen);
} AVCCoder;

AVCCoder* 	        initAVCCoder();
int32_t 			exitAVCCOder(AVCCoder *avcCoder);

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_AVC_H
