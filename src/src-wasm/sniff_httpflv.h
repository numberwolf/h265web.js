//
// Created by 小老虎 on 2020/10/11.
//

#ifndef FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_SNIFF_HTTPFLV_H
#define FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_SNIFF_HTTPFLV_H

#include <stdio.h>
#include <stdlib.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
//#include <libswresample/swresample.h>

#include <pthread.h>
#include "utils/common_av.h"
#include "utils/av_dec_linklist.h"

typedef void(*HTTPFLV_ProbeCallback) (
        double duration, int width, int height, double fps,
        int audioIndex,
        int sample_rate, int channels, int vcodec_name, const char* sample_fmt, int trans_to_gcore);

typedef void(*HTTPFLV_YUVFrameCallback) (
        unsigned char* data_y, unsigned char* data_u, unsigned char* data_v,
        int line1, int line2, int line3, int width,
        int height, double pts, int decodeMS);

typedef void(*HTTPFLV_NaluFrameCallback) (
        unsigned char* data, int len, int isKey,
        int width, int height, double pts, double dts);

typedef void(*HTTPFLV_PCMSamplesCallback) (
        unsigned char* buffer, int line1, int channel, double pts);

// typedef void(*HTTPFLV_AACSamplesCallback) (
//         unsigned char* adts, unsigned char* buffer, int line1, int channel, double pts);

typedef void(*HTTPFLV_AACSamplesCallback) (
        unsigned char* buffer, int line1, int channel, double pts);

///**
// * 媒资
// */
//typedef struct StreamInfo {
//    // audio
//    uint32_t    a_sample_rate;
//    uint32_t    a_channel;
//    char        *a_sample_fmt;
//
//    uint32_t    a_out_sample_rate;
//    uint32_t    a_out_channel;
//    char        *a_out_sample_fmt;
//
//    uint32_t    a_profile;
//
//    // video
//    double      fps;
//    double      v_duration; //= -1
//    double      a_duration; //= -1
//    double      duration; //= -1
//    uint32_t    gop;
//
//    uint32_t    width;
//    uint32_t    height;
//
//    //char        * v_yuv_fmt; // @TODO
//} StreamInfo;
//
///**
// * NALU
// */
//typedef struct NaluInfo {
//    uint8_t *vps;
//    uint32_t vpsLen;
//
//    uint8_t *sps;
//    uint32_t spsLen;
//
//    uint8_t *pps;
//    uint32_t ppsLen;
//
//    uint8_t *sei;
//    uint32_t seiLen;
//
//    uint32_t naluLen;
//} NaluInfo;

/**
 * AVIO buffer
 */
typedef struct buffer_data_flv {
    uint8_t *ptr;
    size_t size; ///< size left in the buffer

    int total;
    int read_pos;
} buffer_data_flv;

/**
 * AVPkt
 */
//typedef struct AVPktNode {
//    AVPacket *avPacket;
//    struct AVPktNode *next;
//} AVPktNode;
// SniffHTTPFLVContext
typedef struct SniffHTTPFLVContext {
    int isSetCallback; // 0 fail 1 ok
    //StreamCallback streamCallback;

    HTTPFLV_ProbeCallback probeCallback;
    HTTPFLV_YUVFrameCallback yuvFrameCallback;
    HTTPFLV_NaluFrameCallback naluFrameCallback;
    HTTPFLV_PCMSamplesCallback pcmSamplesCallback;
    HTTPFLV_AACSamplesCallback aacSamplesCallback;

    MISSILE_SNIFFSTREAM_MODE m_mode;

    int m_threadRefresh;
    pthread_t m_decThread_0;
    AV_DEC_Nalu_LinkList *m_avDecNaluLinkList;

    // ffmpeg codec demuxer member
    AVFormatContext *m_formatCtx;
    AVCodecContext 	*m_vCodecContext;

    // 解码过滤器
    AVBitStreamFilter   *m_absFilter;
    AVBSFContext        *m_absCtx;

    AVCodec         *m_vDecCodec;
    AVCodecContext  *m_vDecCodecContext;

    AVCodecContext 	*m_aCodecContext;
    AVIOContext     *m_pb;
    AVInputFormat   *m_piFmt;

    AVPacket        *m_avPacket;
    AVPacket        *m_decPacket;
    AVFrame      	*m_frame;
    //MissileAvYuvFrame m_missileAvYuvFrame;

    //AVPktNode       *m_pktNodePtr; // point for append frame
    //AVPktNode       *m_pktNodePlayPtr; // point for append frame
    //AVPktNode       *m_pktNodeHead; // head

    AVFrame      	*m_aFrame;
    //SwrContext      *m_swrCtx; // audioscale  sample
    int             m_needSwr; // 0 false 1 true

    int             m_ignoreAudio;

    //存储pcm数据
    //uint8_t *m_sampleBuf;

    buffer_data_flv m_bd;
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

    // outside
    //uint8_t *m_buf; // 临时buf
    //int m_bufLen; // 临时buf
    //struct buffer_data m_bd;

    // method
    void (*introduceMineFunc)();
    int (*initFunc)(struct SniffHTTPFLVContext *sniffHttpFlvContext, MISSILE_SNIFFSTREAM_MODE mode); // outside
    int (*releaseFunc)(struct SniffHTTPFLVContext *sniffHttpFlvContext);

    // outside
    int (*setCodecTypeFunc)(
            struct SniffHTTPFLVContext *sniffHttpFlvContext,
            long probeCallback, long yuvCallback, long naluCallback, long pcmCallback, long aacCallback,
            int ignoreAudio);

    int (*pushBufferFunc)(
            struct SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buf, int buf_size, int probe_size);

    // outside
    int (*getBufferLength)(struct SniffHTTPFLVContext *sniffHttpFlvContext);

    int (*getPacketFunc)(struct SniffHTTPFLVContext *sniffHttpFlvContext, int checkProbe);
    //int (*decodeVideoFrameFunc)(struct SniffHTTPFLVContext *sniffHttpFlvContext);
    int (*decodeVideoFrameFunc)(
            struct SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buff, int len, long pts, long dts, int tag);

    int (*naluLListLengthFunc)(struct SniffHTTPFLVContext *sniffHttpFlvContext);

} SniffHTTPFLVContext;

SniffHTTPFLVContext *newSniffHTTPFLVContext();
int releaseSniffHTTPFLVContext(SniffHTTPFLVContext *sniffHttpFlvContext);

#endif //FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_SNIFF_HTTPFLV_H

