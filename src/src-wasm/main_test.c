#include "libavcodec/avcodec.h"
#include "libavformat/avformat.h"
#include "libswscale/swscale.h"
// #include "process.h"

// emcc web.c process.c ../../lib/libavformat.bc ../../lib/libavcodec.bc ../../lib/libswscale.bc ../../lib/libswresample.bc ../../lib/libavutil.bc     -I./../..     -Os -s WASM=1 -o index.html -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=33554432

// emcc web.c process.c ../../lib/libavformat.bc ../../lib/libavcodec.bc ../../lib/libswscale.bc ../../lib/libswresample.bc ../../lib/libavutil.bc     -I./../..     -Os -s WASM=1 -o index.html -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=16777216


int read_packet(void *opaque, uint8_t *buf, int buf_size);

typedef struct {
    uint8_t *ptr;
    size_t size;
} buffer_data;

buffer_data bufferData;
AVFormatContext *pFormatCtx = NULL;
/* 读内存数据 */
uint8_t *avioCtxBuffer = NULL;
AVIOContext *avioCtx = NULL;


int setFile(uint8_t *buff, const int buffLength) {

    unsigned char *avio_ctx_buffer = NULL;
    // 对于普通的mp4文件，这个size只要1MB就够了，但是对于mov/m4v需要和buff一样大
    size_t avio_ctx_buffer_size = buffLength;
    
    // AVInputFormat* in_fmt = av_find_input_format("h265");

    bufferData.ptr = buff;  /* will be grown as needed by the realloc above */
    bufferData.size = buffLength; /* no data at this point */

    pFormatCtx = avformat_alloc_context();

    avioCtxBuffer = (uint8_t *)av_malloc(avio_ctx_buffer_size);
    
    /* 读内存数据 */
    avioCtx = avio_alloc_context(avioCtxBuffer, avio_ctx_buffer_size, 0, NULL, read_packet, NULL, NULL);

    pFormatCtx->pb = avioCtx;
    pFormatCtx->flags = AVFMT_FLAG_CUSTOM_IO;

    /* 打开内存缓存文件, and allocate format context */
    // pFormatCtx->probesize = 10000 * 1024;
    // pFormatCtx->max_analyze_duration = 100 * AV_TIME_BASE;
    if (avformat_open_input(&pFormatCtx, "", NULL, NULL) < 0) {
        fprintf(stderr, "Could not open input\n");
        return -1;
    }
    av_dump_format(pFormatCtx, 0, "", 0);
    int process_init_ret = process(pFormatCtx);
    printf("process_init_ret:%d\n", process_init_ret);
    
    return process_init_ret;
}

/*
gcc main_test.c process.c -L/usr/local/lib/ \
    -lavformat -lavcodec -lswscale \
    -I./../.. \
    `pkg-config --libs --cflags libavformat` `pkg-config --libs --cflags libavcodec` `pkg-config --libs --cflags libswscale` \
    -o avc
 */
int setFileUrl(char * rtspUrl) {

    unsigned char *avio_ctx_buffer = NULL;
    // 对于普通的mp4文件，这个size只要1MB就够了，但是对于mov/m4v需要和buff一样大
    // size_t avio_ctx_buffer_size = buffLength;
    
    // AVInputFormat* in_fmt = av_find_input_format("h265");

    //bufferData.ptr = buff;  /* will be grown as needed by the realloc above */
    //bufferData.size = buffLength; /* no data at this point */

    pFormatCtx = avformat_alloc_context();
    int ret = avformat_open_input(&pFormatCtx,rtspUrl,NULL,NULL);
    printf("%d\n",ret);

    // avioCtxBuffer = (uint8_t *)av_malloc(avio_ctx_buffer_size);
    
    // /* 读内存数据 */
    // avioCtx = avio_alloc_context(avioCtxBuffer, avio_ctx_buffer_size, 0, NULL, read_packet, NULL, NULL);

    // pFormatCtx->pb = avioCtx;
    // pFormatCtx->flags = AVFMT_FLAG_CUSTOM_IO;

    /* 打开内存缓存文件, and allocate format context */
    // pFormatCtx->probesize = 10000 * 1024;
    // pFormatCtx->max_analyze_duration = 100 * AV_TIME_BASE;
    // if (avformat_open_input(&pFormatCtx, "", NULL, NULL) < 0) {
    //     fprintf(stderr, "Could not open input\n");
    //     return -1;
    // }
    av_dump_format(pFormatCtx, 0, "", 0);
    int process_init_ret = process(pFormatCtx);
    printf("process_init_ret:%d\n", process_init_ret);
    
    return process_init_ret;
}



int release() {
    // processClose();

    // // 清掉内存
    // avformat_close_input(&pFormatCtx);
    // avformat_free_context(pFormatCtx);
    // pFormatCtx = NULL;
    // av_free(avioCtx->buffer);
    // av_free(avioCtx);
    // av_free(avioCtxBuffer);

    return 0;
}


ImageData *getFrame() {
    ImageData *result = loopFrameData(pFormatCtx);
    return result;
}

/*
 * Others
 gcc main_test.c process.c -L../ffmpeg-3.4.6/lib \
    -lavformat -lavcodec -lswscale \
    -I../ffmpeg-3.4.6 \
    `pkg-config --libs --cflags libavformat` `pkg-config --libs --cflags libavcodec` `pkg-config --libs --cflags libswscale` \
    -o main_test
 */
int main () {
    av_register_all();
    avformat_network_init();
    printf("ffmpeg init done\n");
    setFileUrl((char *)"/Users/numberwolf/Documents/Movies/barsandtone.flv");
    getFrame();
    return 0;
}

int read_packet(void *opaque, uint8_t *buf, int buf_size) {

    buf_size = FFMIN(buf_size, bufferData.size);

    if (!buf_size)
        return AVERROR_EOF;
    // printf("ptr:%p size:%zu bz%zu\n", bufferData.ptr, bufferData.size, buf_size);

    /* copy internal buffer data to buf */
    memcpy(buf, bufferData.ptr, buf_size);
    bufferData.ptr += buf_size;
    bufferData.size -= buf_size;

    return buf_size;
}

