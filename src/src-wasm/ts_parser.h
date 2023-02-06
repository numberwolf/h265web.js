//
// Created by 小老虎 on 2020/8/15.
//

/*
 * Support
 *   --enable-demuxer=mov \
     --enable-demuxer=mpegts \
     --enable-demuxer=mpegtsraw \
     --enable-demuxer=aac \
     --enable-demuxer=flv \
     --enable-demuxer=mp3 \
 */

#ifndef TECH_FFMPEG_ROI_TS_PARSER_H
#define TECH_FFMPEG_ROI_TS_PARSER_H

#include <stdio.h>
#include <stdlib.h>
#include <libavformat/avformat.h>
#include "decoder/avc.h"
#include "decoder/hevc.h"

// 32bits system
/*
let ptr = ModuleTS.cwrap('getPacket', 'number', [])(); // 1bytes 

// In HEAPU32, 1 bytes = ptr / 4 , so address: ptr/4 + 0 = first uint32_t index
// next uint32_t is ptr/4 + 1 address
let type = ModuleTS.HEAPU32[ptr / 4]; // 0 video 1 audio
let size = ModuleTS.HEAPU32[ptr / 4 + 1]; // 4 bytes 32 bits
let ptime = ModuleTS.HEAPF64[ptr / 8 + 1]; // 8 bytes
let dtime = ModuleTS.HEAPF64[ptr / 8 + 1 + 1];

let dataPtr = ModuleTS.HEAPU32[ptr / 4 + 1 + 1 + 2 + 2]; // 4bytes ptr
let dataPacket = ModuleTS.HEAPU8.subarray(dataPtr, dataPtr + size);
 */
typedef struct PacketData { // 1 bytes ptr
    uint32_t type; // 4bytes -1 null 0 video 1 audio
    uint32_t size; // 4bytes
    double ptime; // 8 bytes
    double dtime; // 8 bytes
    uint32_t frameType; // 4bytes 1keyframe 0not @TODO
    uint8_t *data; // 4 bytes ptr
} PacketData;

typedef struct MediaInfo {
    uint32_t    a_sample_rate;
    uint32_t    a_channel;

    double      fps;
    double      v_duration; //= -1
    double      a_duration; //= -1
    double      duration; //= -1
    uint32_t    gop;
    
    //double      v_duration; //= -1
    //double      a_duration; //= -1
    //double      duration; //= -1
} MediaInfo;

typedef struct ExtensionInfo {
    uint32_t    width; 	//= -1;
    uint32_t    height; //= -1;
} ExtensionInfo;

// cache the packets when ts or flv cannot get duration
typedef struct CachePktNode {
    PacketData *pktData;
    struct CachePktNode *next;
} CachePktNode;

typedef struct TSBox {
    // private
    int                     generateMode; // 获取数据模式 0 默认 PacketData 1 Cache链表
    CachePktNode            *cachePtr;

    AVCCoder                *avcCoder;
    HEVCoder                *hevCoder;

    // Member
    AVFormatContext         *formatContext;
//    AVInputFormat           *inputFormat;

    AVPacket                *avPacket;

    // 外显数据
    PacketData  			*packetData;
    MediaInfo               mediaInfo;
    ExtensionInfo           extensionInfo;

    double                  v_timebase;
    double                  a_timebase;

    int64_t                 v_start_time;
    int64_t                 a_start_time;

    char                    *v_codec;
    char                    *a_codec;

    double                  v_fps;
    int                     v_gop;

    // int 					v_width; 	//= -1;
    // int 					v_height; 	//= -1;
    int                     v_video_index;
    int                     v_audio_index;

    /**
     * demuxer init
     * @param tsBox
     * @param type 0 265 1 264
     * @return
     */
    int 					(*initializeDemuxerFunc)(struct TSBox *tsBox);
    void 					(*introduceMineFunc)();

    int                     (*demuxBoxFunc)(struct TSBox *tsBox, uint8_t *buff, int in_len, int isLive);
    int 					(*getPacketFunc)(struct TSBox *tsBox);

    int 					(*releaseDemuxerFunc)(struct TSBox *tsBox);
} TSBox;

TSBox* 	            initTSDemuxer(); // VCodecContext *vcodecer)
int 			    exitTSDemuxer(TSBox *tsBox); // VCodecContext *vcodecer

#endif //TECH_FFMPEG_ROI_TS_PARSER_H
