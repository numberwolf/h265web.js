//
// Created by 小老虎 on 2020/8/29.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_CODEC_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_CODEC_H



/*
 * VIDEO
 */

#define V_CODEC_NAME_HEVC 265
#define V_CODEC_NAME_AVC  264
#define V_CODEC_NAME_UNKN 500

#define A_CODEC_NAME_AAC    112
#define A_CODEC_NAME_MP3    113
#define A_CODEC_NAME_UNKN   500

#define NALU_TYPE       uint32_t
#define NALU_TYPE_NULL  0x00
#define NALU_TYPE_UNKN  0x02
#define NALU_TYPE_VPS   0x51
#define NALU_TYPE_SPS   0x52
#define NALU_TYPE_PPS   0x53
#define NALU_TYPE_SEI   0x54
#define NALU_TYPE_I_F   0x55
#define NALU_TYPE_PB_F  0x56

static const uint8_t SPLIT_SEQ[] = {0x00, 0x00, 0x01};
static const uint8_t START_CODE[] = {0x00, 0x00, 0x00, 0x01};

/**
 * AVC 264
 */
static const uint8_t AVC_AUD[]    = {0x00, 0x00, 0x01, 0x09, 0xE0};

// Use last bit to check
// 103 104
static const uint8_t AVC_NALU_SPS[] = {0x00, 0x00, 0x01, 0x67}; // 103
static const uint8_t AVC_NALU_PPS[] = {0x00, 0x00, 0x01, 0x68}; // 104
static const uint8_t AVC_NALU_SEI[] = {0x00, 0x00, 0x01, 0x06}; // 6

static const uint8_t AVC_I_FRAME = 0x65;
static const uint8_t AVC_PB_FRAME = 0x41;

/**
 * HEVC 265
 */
static const uint8_t HEVC_AUD[]   = {0x00, 0x00, 0x01, 0x46, 0x01, 0x50};

// 64 66 68 78
static const uint8_t HEVC_NALU_VPS[] = {0x00, 0x00, 0x01, 0x40}; // 64
static const uint8_t HEVC_NALU_SPS[] = {0x00, 0x00, 0x01, 0x42}; // 66
static const uint8_t HEVC_NALU_PPS[] = {0x00, 0x00, 0x01, 0x44}; // 68
static const uint8_t HEVC_NALU_SEI[] = {0x00, 0x00, 0x01, 0x4e}; // 78

// 16 17 18 19 20 21
static const uint8_t HEVC_I_FRAME_DEF[] = {0x10, 0x11, 0x12, 0x13, 0x14, 0x15};
// 1~9
// 0x01 special
static const uint8_t HEVC_PB_FRAME_DEF[] = {0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09};





/*
 * AUDIO
 */
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

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_CODEC_H
