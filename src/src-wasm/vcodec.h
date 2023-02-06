#include <libavcodec/avcodec.h>
// #include <pthread.h>
// #include "utils/common_av.h"
// #include "utils/av_dec_linklist.h"

#define CODEC_TYPE int
#define CODEC_H265 0
#define CODEC_H264 1

typedef void(*VideoCallback) (
        unsigned char* data_y, unsigned char* data_u, unsigned char* data_v,
        int line1, int line2, int line3, int width,
        int height, double pts);

//typedef struct {
//    uint32_t width;
//    uint32_t height;
//    uint8_t *dataY;
//    uint8_t *dataChromaB;
//    uint8_t *dataChromaR;
//} ImageData;

typedef struct VCodecContext {
    int debugNum;

    int permitted; // -1 failed , 1 OK
    // int m_threadRefresh;
    // pthread_t m_decThread_0;
    // AV_DEC_Nalu_LinkList *m_avDecNaluLinkList;

    CODEC_TYPE codecType;
    VideoCallback videoCallback;

	// Member
    double                  v_timebase;
	AVCodec  				*codec;
	AVCodecContext 			*codecContext;
	AVFrame      			*frame;
    AVFrame      			*outFrame;
    struct SwsContext       *swCtx;
	//ImageData  				*imageData;
	AVPacket                *avPacket;

	int                     useFree; // -1 not free 0 free
    int                     v_needScale; // -1 not set ,0 not scale, 1 scale
	int 					v_width; 	//= -1;
	int 					v_height; 	//= -1;

	// Function
	// O. init
	int 					(*initializeDecoderFunc)(struct VCodecContext *vcodecer);
    int 					(*setCodecTypeFunc)(
            struct VCodecContext *vcodecer, CODEC_TYPE codecType, long callback);
	void 					(*introduceMineFunc)();
	// 1.1 decode1
	int 					(*decodeCodecContextFunc)(
	        struct VCodecContext *vcodecer, uint8_t *buff, int in_len, long pts, int flush);
    // 2. get yuv
	int 					(*_getFrame)(struct VCodecContext *vcodecer);
	// 3. close
	int 					(*closeVideoFunc)(struct VCodecContext *vcodecer);
	int 					(*releaseFunc)(struct VCodecContext *vcodecer);
} VCodecContext;

VCodecContext* 	initVcodec(); // VCodecContext *vcodecer)
int 			exitVcodec(VCodecContext *vcodecer);
