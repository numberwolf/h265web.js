//
// Created by 小老虎 on 2020/9/24.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_TOOLS_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_TOOLS_H

#define  MAX(x,y)    ((x) > (y) ? (x) : (y))
#define  MIN(x,y)    ((x) < (y) ? (x) : (y))

#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>

int
STRCMP (const char *p1, const char *p2);

int getRandom(int max);

const char* encryptMd5(const char* encryptInput, int inputLen);

long getTimestampSec();

/**
 * re malloc
 * @param src
 * @param src_len
 * @param data
 * @param data_len
 * @return
 */
uint8_t *reMallocU8(uint8_t *src, int src_len, uint8_t *data, int data_len) ;

int removeMallocU8(uint8_t *src, int src_len, uint8_t *dst, int start, int dstLen);

long getMillisecondTime();


#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_TOOLS_H
