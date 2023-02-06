//
// Created by 小老虎 on 2022/6/5.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SNIFF_G711CORE_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SNIFF_G711CORE_H

#include <stdio.h>
#include <stdlib.h>

#include <libavutil/opt.h>

#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>

#include <libavutil/samplefmt.h>
#include <libavutil/channel_layout.h>
#include <libavresample/avresample.h>
#include <libswresample/swresample.h>

#include <pthread.h>
#include "utils/common_av.h"

typedef void(*G711_ProbeCallback) (
        double duration, int width, int height, double fps,
        int audioIndex,
        int sample_rate, int channels, int vcodec_name, const char* sample_fmt);

typedef void(*G711_YUVFrameCallback) (
        unsigned char* data_y, unsigned char* data_u, unsigned char* data_v,
        int line1, int line2, int line3, int width,
        int height, double pts, int decodeMS);

typedef void(*G711_PCMSamplesCallback) (
        unsigned char* buffer, int line1, double pts, int decodeMS);

/**
 * AVIO buffer
 */
typedef struct buffer_data_g711 {
    uint8_t *ptr;
    size_t size; ///< size left in the buffer

    int total;
    int read_pos;
} buffer_data_g711;

/**
 * AVPkt
 */
//typedef struct AVPktNode {
//    AVPacket *avPacket;
//    struct AVPktNode *next;
//} AVPktNode;
// SniffG711CoreContext
typedef struct SniffG711CoreContext {
    int isSetCallback; // 0 fail 1 ok

    G711_ProbeCallback probeCallback;
    G711_YUVFrameCallback yuvFrameCallback;
    G711_PCMSamplesCallback pcmSamplesCallback;

    MISSILE_SNIFFSTREAM_MODE m_mode;

    int m_threadRefresh;
    pthread_t m_decThread_0;

    // ffmpeg codec demuxer member
    AVFormatContext *m_formatCtx;
    AVCodecContext 	*m_vCodecContext;

    // 解码过滤器
    AVBitStreamFilter   *m_absFilter;
    AVBSFContext        *m_absCtx;

    AVCodecContext 	*m_aCodecContext;
    AVIOContext     *m_pb;
    AVInputFormat   *m_piFmt;

    AVPacket        *m_avPacket;
    AVFrame      	*m_frame;

    AVFrame      	    *m_aFrame;
    struct SwrContext   *m_swr_ctx;
    int                 m_dstFramePerSampleSize;
    int                 m_needSwr; // 0 false 1 true

    int             m_ignoreAudio;

    buffer_data_g711 m_bd;
    uint8_t *m_bd_temp_ptr;

    /*
     * 0 : ing
     * 1 : ready
     */
    int m_probe;

    int m_videoIndex;
    int m_audioIndex;

    // my extension member
    StreamInfo m_mediaInfo;
    NaluInfo *m_naluInfo;

    double m_vTimebase;
    double m_aTimebase;

    int64_t m_vStartTime;
    int64_t m_aStartTime;

    uint32_t m_vCodec;
    uint32_t m_aCodec;

    // double m_fps;
    int m_gop;

    // method
    void (*introduceMineFunc)();
    int (*initFunc)(struct SniffG711CoreContext *sniffG711CoreContext, MISSILE_SNIFFSTREAM_MODE mode); // outside
    int (*releaseFunc)(struct SniffG711CoreContext *sniffG711CoreContext);

    // outside
    int (*setCodecTypeFunc)(
            struct SniffG711CoreContext *sniffG711CoreContext,
            long probeCallback, long yuvCallback, long pcmCallback,
            int ignoreAudio);

    int (*pushBufferFunc)(
            struct SniffG711CoreContext *sniffG711CoreContext, uint8_t *buf, int buf_size, int probe_size);

    int (*decodeVideoFrameFunc)(struct SniffG711CoreContext *sniffG711CoreContext);

    int (*getBufferLength)(struct SniffG711CoreContext *sniffG711CoreContext);

} SniffG711CoreContext;

SniffG711CoreContext *newSniffG711CoreContext();
int releaseSniffG711CoreContext(SniffG711CoreContext *sniffG711CoreContext);

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SNIFF_G711CORE_H
