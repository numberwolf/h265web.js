//
// Created by 小老虎 on 2020/8/29.
//
#ifndef TECH_FFMPEG_ROI_TS_UTILS_H
#define TECH_FFMPEG_ROI_TS_UTILS_H

#include <stdio.h>
#include <stdlib.h>

/*
   ff       f1         50     40       01       7f       fc       --> 01182007
11111111 11110001 01010000 0100 0000 00000001 01111111 11111100
|---12bits--|
                               |
|------------- 28bits----------|-----------------28 bits-------|
                                 |00 00000001 011| = pkt length = 1011 = 11 (bytes)
                                 --------------------------------------------------
                                 |     ff f1 50 40 01 7f fc 01 18 20 07 <- 11 bytes

   ff       f1              50                 40       01       7f       fc       --> 01182007
11111111|1111 0  00  1  | 01     0100 0  0|01 0   0  00 [00|00000001|011] 11111|111111  00
|---12bits--| 1b 2b  1b   2b      4b  1b  3b  1b  1b          13b             11b       2b
      v       v           v        v              v           v               v
   syncword  ID          profile  freq           home        pkt_len         fullness
 */
typedef struct ADTSHeader {
    uint16_t syncword; // 12bits
    uint8_t ID; // 1bit
    uint8_t layer; // 2bits
    uint8_t protectionAbsent; // 1bit
    uint8_t profile; // 2bits
    uint8_t freqIdx; // 4bits
    uint8_t privateBit; // 1bit
    uint8_t channelConfigure; // 3bits
    uint8_t originCopy; // 1bit
    uint8_t home; // 1bit
} ADTSHeader;

//int
//STRCMP (const char *p1, const char *p2);

/*
const SAMPLEINDEX = {
    96000 : 0x00,
    88200 : 0x01,
    64000 : 0x02,
    48000 : 0x03,
    44100 : 0x04,
    32000 : 0x05,
    24000 : 0x06,
    22050 : 0x07,
    16000 : 0x08,
    12000 : 0x09,
    11025 : 0x0a,
    8000 : 0x0b,
    7350 : 0x0c,
    'Reserved' : 0x0d, // == 0x0e
    'frequency is written explictly' : 0x0f
}
*/
static const uint8_t FREQ_OFFSET_TABLE[13] = { 0x00, 0x01, 0x02, 0x03, 
                                        0x04, 0x05, 0x06, 0x07, 
                                        0x08, 0x09, 0x0a, 0x0b, 
                                        0x0c
                                       };

static const uint32_t SAMPLERATE_OFFSET_TABLE[13] = {  96000, 88200, 64000, 48000, 
                                                44100, 32000, 24000, 22050, 
                                                16000, 12000, 11025, 8000, 
                                                7350
                                              };


#define DEF_HEVC_STRING "hevc"
#define DEF_H265_STRING "h265"

#define DEF_AVC_STRING "avc"
#define DEF_H264_STRING "h264"

#define DEF_AAC_STRING "aac"
#define DEF_MP3_STRING "mp3"

/*
 * Codec
 */
#define CODEC_OFFSET_LENGTH 6
static const char* CODEC_NAME_OFFSET_TABLE[CODEC_OFFSET_LENGTH] = { DEF_HEVC_STRING, DEF_H265_STRING,
                                                                    DEF_AVC_STRING,  DEF_H264_STRING,
                                                                    DEF_AAC_STRING,  DEF_MP3_STRING
};

//static const uint32_t CODEC_OFFSET_TABLE[CODEC_OFFSET_LENGTH] = {   1, 1, // hevc
//                                                                    2, 2, // avc
//                                                                    3, 4
//};

uint32_t tsmuxerUtilSampleOffsetTable(uint8_t freqIdx);
int32_t tsmuxerUtilCodecTable(const char *codecName);

#endif // TECH_FFMPEG_ROI_TS_UTILS_H
