//
// Created by 小老虎 on 2020/10/11.
//

#ifndef FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_SNIFF_STREAM_H
#define FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_SNIFF_STREAM_H

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libswscale/swscale.h>
//#include <libswresample/swresample.h>

#include "utils/common_av.h"
#include "utils/av_dec_linklist.h"
#include "seek_desc.h"

//typedef void(*StreamCallback) (
//        unsigned char* naluData, int len, int width, int height, double pts);

typedef void(*ProbeCallback) (
        double duration, uint32_t width, uint32_t height, double fps,
        uint32_t audioIndex,
        uint32_t sample_rate, uint32_t channels, uint32_t vcodec_name, const char* sample_fmt);

typedef void(*YUVFrameCallback) (
        unsigned char* data_y, unsigned char* data_u, unsigned char* data_v,
        int line1, int line2, int line3,
        int width, int height, double pts, int tag);

//typedef void(*RGB24FrameCallback) (
//        unsigned char* data_rgb24,
//        int line1,
//        int width, int height, double pts, int tag);

typedef void(*NaluFrameCallback) (
        unsigned char* data, int len, int isKey,
        int width, int height, double pts, double dts);

typedef void(*NaluVodFrameCallback) (
        unsigned char* data, int len, int isKey,
        int width, int height, double pts, double dts, int isRawStream);

//typedef void(*PktFrameCallback) (
//        unsigned char* data, int size,
//        int width, height, double pts, double dts);

typedef void(*PCMSamplesCallback) (
        unsigned char* buffer, int line1, int channel, double pts);

// typedef void(*AACSamplesCallback) (
//         unsigned char* adts, unsigned char* buffer, int line1, int channel, double pts);
typedef void(*AACSamplesCallback) (
        unsigned char* aacFrame, int line1, int channel, double pts);



/**
 * AVIO buffer
 */
typedef struct buffer_data {
    //uint8_t *resource;
    uint8_t *seek_ptr; // 也是指向buffer数据的指针,之所以定义ori_ptr,是用在自定义seek函数中
    uint8_t *ptr; // 原始数据ptr 非偏移量
    size_t size; ///< size left in the buffer

    int file_size;
    int read_pos;
} buffer_data;

/**
 * AVPkt
 */
//typedef struct AVPktNode {
//    AVPacket *avPacket;
//    struct AVPktNode *next;
//} AVPktNode;

typedef struct SniffStreamContext {
    int isSetCallback; // 0 fail 1 ok
    //StreamCallback streamCallback;

    ProbeCallback probeCallback;
    YUVFrameCallback yuvFrameCallback;
    //RGB24FrameCallback rgb24FrameCallback;
    NaluVodFrameCallback naluFrameCallback;
    PCMSamplesCallback pcmSamplesCallback;
    AACSamplesCallback aacSamplesCallback;

    MISSILE_SNIFFSTREAM_MODE m_mode;

    int m_threadRefresh;
    pthread_t m_decThread_0;

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
    //AVFrame      	*m_outFrame;
    //MissileAvYuvFrame m_missileAvYuvFrame;

    //struct SwsContext *m_swCtx;

    //AVPktNode       *m_pktNodePtr; // point for append frame
    //AVPktNode       *m_pktNodePlayPtr; // point for append frame
    //AVPktNode       *m_pktNodeHead; // head

    //AVFrame      	*m_aFrame;
    //SwrContext      *m_swrCtx; // audioscale  sample
    int             m_needSwr; // 0 false 1 true

    int             m_ignoreAudio;

    //存储pcm数据
    //uint8_t *m_sampleBuf;

    buffer_data m_bd;
    uint8_t *m_bd_temp_ptr;

    /*
     * 0 : ing
     * 1 : ready
     */
    int m_probe;
    int m_probeRetry;

    int m_videoIndex;
    int m_audioIndex;

    // my extension member
    StreamInfo m_mediaInfo;
    NaluInfo *m_naluInfo;

    double m_decLastPTS;

    double m_vTimebase;
    double m_aTimebase;

    int64_t m_vStartTime;
    int64_t m_aStartTime;

    uint32_t m_vCodec;
    //uint32_t m_aCodec;

    double m_frameDuration;
    double m_defaultFps;
    int m_isRawStream; // 0 no 1 yes
    double m_rawStreamNoFpsPts;

    //double m_fps;
    //int m_gop;

    // outside
    //uint8_t *m_buf; // 临时buf
    //int m_bufLen; // 临时buf
    //struct buffer_data m_bd;

    // dec nalus link list
    AV_DEC_Nalu_LinkList *m_avDecNaluLinkList;

    // seekinfo
    SeekDesc m_seekDesc;

    /*
     *
     * method
     *
     */
    void (*introduceMineFunc)();
    int (*initFunc)(struct SniffStreamContext *sniffStreamContext, MISSILE_SNIFFSTREAM_MODE mode); // outside
    int (*releaseFunc)(struct SniffStreamContext *sniffStreamContext);

    // outside
    int (*setCodecTypeFunc)(
            struct SniffStreamContext *sniffStreamContext,
            long probeCallback, long yuvCallback, long naluCallback, long pcmCallback, long aacCallback,
            int ignoreAudio, double defaultFps);

    int (*pushBufferFunc)(struct SniffStreamContext *sniffStreamContext,
                          uint8_t *buf, int buf_size,
                          int probe_size, int file_size);

    // outside
    int (*seekBufferFunc)(struct SniffStreamContext *sniffStreamContext, double seek_pos);
    //int (*splitBufferFunc)(struct SniffStreamContext *sniffStreamContext, double start, double end);
    int (*getPacketFunc)(struct SniffStreamContext *sniffStreamContext, int checkProbe, int skip);
    //int (*decodeVideoFrameFunc)(struct SniffStreamContext *sniffStreamContext);
    int (*decodeVideoFrameFunc)(
            struct SniffStreamContext *sniffStreamContext, uint8_t *buff, int len,
            long pts, long dts, int tag, int skip);
    int (*naluLListLengthFunc)(struct SniffStreamContext *sniffStreamContext);

} SniffStreamContext;

SniffStreamContext *newSniffStreamContext();
int releaseSniffStreamContext(SniffStreamContext *sniffStreamContext);

#endif //FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_SNIFF_STREAM_H

