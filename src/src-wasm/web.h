//
// Created by 小老虎 on 2020/8/16.
//
// For TEST!!!!!!!!

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_WEB_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_WEB_H
#include "ts_parser.h"

/*
 * @TEST
 */

int initTsMissile();
int exitTsMissile();
int initializeDemuxer();

int demuxBox(uint8_t *buff, int in_len);

MediaInfo *getMediaInfo();
ExtensionInfo *getExtensionInfo();

uint32_t getVideoCodecID();
uint32_t getAudioCodecID();

/*
 * Data Functions
 */
PacketData *getPacket();

// VLC Layer
uint32_t getVLCLen();
uint8_t *getVLC();

// NALU Layer
uint32_t getVPSLen();
uint8_t *getVPS();

uint32_t getSPSLen();
uint8_t *getSPS();

uint32_t getPPSLen();
uint8_t *getPPS();

uint32_t getSEILen();
uint8_t *getSEI();



#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_WEB_H
