//
// Created by 小老虎 on 2020/9/24.
//
#include "tools.h"
#include <time.h>
// #include <sys/time.h>
#include <string.h>
#include "md5.h"

int
STRCMP (const char *p1, const char *p2)
{
    const unsigned char *s1 = (const unsigned char *) p1;
    const unsigned char *s2 = (const unsigned char *) p2;
    unsigned char c1, c2;

    do {
        c1 = (unsigned char) *s1++;
        c2 = (unsigned char) *s2++;
        if(c1 == '\0')
            return c1 - c2;
    } while (c1 == c2);

    return c1 - c2;
}

int getRandom(int max) {
    srand((int) time(NULL));     //每次执行种子不同，生成不同的随机数
    return rand() % max;
}

const char* encryptMd5(const char* encryptInput, int inputLen) {
    MD5_CTX md5;
    MD5Init(&md5);
    int i;
    unsigned char encrypt[inputLen]; //21232f297a57a5a743894a0e4a801fc3
    strcpy(encrypt, encryptInput);

    unsigned char decrypt[16];
    MD5Update(&md5, encrypt, strlen(encrypt));
    MD5Final(&md5, decrypt);

    char strBuf[33] = {0};
    char pbuf[32];
    for(i = 0; i < 16; i++) {
        sprintf(pbuf, "%02X", decrypt[i]);
        strncat(strBuf, pbuf, 2);

        //printf("%02X ", decrypt[i]);
    }
    //printf("\n");
    return strBuf;
}

long getTimestampSec() {
    struct timeval tv;
    gettimeofday(&tv, NULL);

    return tv.tv_sec;
}

//uint8_t *reMallocU8(uint8_t *src, int src_len, uint8_t *data, int data_len) {
//    printf("reMallocU8 src is null:%d, src_len:%d, data is null:%d data_len:%d\n",
//            src == NULL, src_len, data == NULL, data_len);
//    int dstLen = src_len + data_len;
//    uint8_t *dst = (uint8_t *) realloc(src, sizeof(uint8_t) * dstLen);
//    //uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
//    memcpy(dst, src, src_len);
//    memcpy(dst + src_len, data, data_len);
//    return dst;
//}

uint8_t *reMallocU8(uint8_t *src, int src_len, uint8_t *data, int data_len) {

    //printf("reMallocU8 src %p %d %d %d is null:%d, src_len:%d, data is null:%d data_len:%d\n",
    //       src, src[0], src[1], src[2], src == NULL, src_len, data == NULL, data_len);

    int dstLen = src_len + data_len;

    //uint8_t *dst = (uint8_t *) realloc(src, sizeof(uint8_t) * dstLen);
    uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
    memcpy(dst, src, src_len);
    memcpy(dst + src_len, data, data_len);
    return dst;
}

int removeMallocU8(uint8_t *src, int src_len, uint8_t *dst, int rm_size, int dstLen) {
    if (rm_size >= src_len) {
        //printf("removeMallocU8 error! %d >= %d", rm_size, src_len);
        return -1;
    }
    //int dstLen = src_len - rm_size;
    //uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
    memcpy(dst, src + rm_size, dstLen);
    return 0;
}

//uint8_t *reMallocU8WithPtrPos(
//        uint8_t *src,
//        int read_pos, int total_len,
//        uint8_t *data, int data_len) {
//
//    //printf("reMallocU8 src is null:%d, src_len:%d, data is null:%d data_len:%d\n",
//    //       src == NULL, src_len, data == NULL, data_len);
//
//    printf("1 ");
//    src -= read_pos;
//    printf("2 ");
//    int dstLen = total_len + data_len;
//    printf("3 ");
//    uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
//    printf("4 ");
//
//    dst += read_pos;
//    printf("5 ");
//
//    //uint8_t *dst = (uint8_t *) realloc(src, sizeof(uint8_t) * dstLen);
//    //uint8_t *dst = (uint8_t *) malloc(sizeof(uint8_t) * dstLen);
//    memcpy(dst, src, total_len);
//    memcpy(dst + total_len, data, data_len);
//    printf("6 \n");
//
//    return dst;
//}

// int64_t
long getMillisecondTime() {
    // _STRUCT_TIMEVAL
    // {
    //     __darwin_time_t	        tv_sec;	        /* seconds */
    //     __darwin_suseconds_t    tv_usec;        /* and microseconds */
    // };
    struct timeval time;
    gettimeofday(&time, NULL);
    return time.tv_sec * 1000L + (long) time.tv_usec / 1000L;
} // getMillisecondTime


