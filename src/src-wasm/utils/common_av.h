//
// Created by 小老虎 on 2021/3/14.
//

#ifndef FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_COMMON_AV_H
#define FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_COMMON_AV_H

#include <libavutil/samplefmt.h>

#define MISSILE_DEC_THREAD_COUNT 4

#define MISSILE_CMD_IS_RELEASE_TYPE int
#define MISSILE_CMD_IS_RELEASE_YES  1
#define MISSILE_CMD_IS_RELEASE_NO   0

#define MISSILE_PKT_GET_TYPE_AAC 100
#define MISSILE_PKT_GET_TYPE_PCM 150
#define MISSILE_PKT_GET_TYPE_HAVE_VIDEO 200
#define MISSILE_PKT_GET_TYPE_YUV 300
#define MISSILE_PKT_GET_NOTHING 404

#define MISSILE_SNIFFSTREAM_MODE int
#define MISSILE_SNIFFSTREAM_MODE_VOD 0
#define MISSILE_SNIFFSTREAM_MODE_LIVE 1
#define MISSILE_SNIFFSTREAM_MODE_DECODER 2
#define MISSILE_SNIFFSTREAM_MODE_VOD_DEMUXER 100
#define MISSILE_SNIFFSTREAM_MODE_LIVE_DEMUXER 101

#define MISSILE_SNIFFSTREAM_VOD_MAX_RETRY_PROBE 3

#define MISSILE_PTHREAD_WAIT_TO_CREATE 0
#define MISSILE_PTHREAD_ALREADY_CREATE 1
#define MISSILE_PTHREAD_WAIT_TO_RELEASE 2

/**
 * 媒资
 */
typedef struct StreamInfo {
    // audio
    uint32_t    a_sample_rate;
    uint32_t    a_channel;
    char        *a_sample_fmt;

    uint32_t    a_out_sample_rate;
    uint32_t    a_out_channel;
    char        *a_out_sample_fmt;

    uint32_t    a_profile;

    // video
    double      fps;
    double      v_duration; //= -1
    double      a_duration; //= -1
    double      duration; //= -1
    uint32_t    gop;

    uint32_t    width;
    uint32_t    height;

    //char        * v_yuv_fmt; // @TODO
} StreamInfo;

/**
 * NALU
 */
typedef struct NaluInfo {
    uint8_t *vps;
    uint32_t vpsLen;

    uint8_t *sps;
    uint32_t spsLen;

    uint8_t *pps;
    uint32_t ppsLen;

    uint8_t *sei;
    uint32_t seiLen;

    uint32_t naluLen;
} NaluInfo;

typedef struct MissileAvYuvFrame {
    uint8_t *luma;
    uint8_t *chromaB;
    uint8_t *chromaR;
} MissileAvYuvFrame;



int find_sample_index(int samplerate);

double pts_fixed_2(double pts);

#endif //FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_COMMON_AV_H
