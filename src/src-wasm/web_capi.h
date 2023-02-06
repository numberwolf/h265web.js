#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_WEB_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_WEB_H

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#include "utils/common_string.h"
#include "utils/secret.h"
#include "utils/tools.h"
#include "utils/ts_utils.h"

#include "vcodec.h"
#include "ts_parser.h"
#include "sniff_stream.h"
#include "sniff_httpflv.h"
#include "sniff_g711core.h"

/* ****************************************************************
 *
 *
 *
 *             1.Decoder
 *
 *
 *
 * ****************************************************************/

VCodecContext *registerPlayer(const char *token, const char* version);
int initMissile(VCodecContext *vcodecer);
int setCodecType(VCodecContext *vcodecer, CODEC_TYPE codecType, long callback);
int exitMissile(VCodecContext *vcodecer);
int initializeDecoder(VCodecContext *vcodecer);
int decodeCodecContext(VCodecContext *vcodecer, uint8_t *buff, int in_len, long pts, int flush);
int closeVideo(VCodecContext *vcodecer);
int release(VCodecContext *vcodecer);

/*****************************************************************
 *
 *
 *
 *            2. TSDemuxer
 *
 *
 *
 *****************************************************************/
int initTsMissile();
int exitTsMissile();

/**
 * demuxer init
 * @param tsBox
// * @param type 0 265 1 264
 * @return
 */
int initializeDemuxer();
int demuxBox(uint8_t *buff, int in_len, int isLive);
MediaInfo *getMediaInfo();
ExtensionInfo *getExtensionInfo();
uint32_t getVideoCodecID();
uint32_t getAudioCodecID();
/*
 * Data Functions
 */
// resource packet
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

/* ****************************************************************
 *
 *
 *
 *             3.Full Demuxer+Decoder
 *
 *
 *
 * ****************************************************************/
SniffStreamContext *AVSniffStreamInit(const char *token, const char* version);
int releaseSniffStream(SniffStreamContext *sniffStreamContext);
int initializeSniffStreamModule(
        SniffStreamContext *sniffStreamContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        MISSILE_SNIFFSTREAM_MODE mode
);
// void *myThread(void *arg);
//     SniffStreamContext *sniffStreamContext = (SniffStreamContext *) arg;
//     EM_ASM(alert(111));
//     EM_ASM(
//             postMessage({cmd:"go"});
//     );
// } // myThread

int initializeSniffStreamModuleWithAOpt(
        SniffStreamContext *sniffStreamContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        int ignoreAudio,
        MISSILE_SNIFFSTREAM_MODE mode,
        double defaultFps
);

int pushSniffStreamData(
        SniffStreamContext *sniffStreamContext, uint8_t *buff, int in_len, int probe_size);
int getSniffStreamPkg(SniffStreamContext *sniffStreamContext);
int getSniffStreamPkgNoCheckProbe(SniffStreamContext *sniffStreamContext);
int decodeVideoFrame(
        SniffStreamContext *sniffStreamContext,
        uint8_t *buff, int len, long pts, long dts, int tag);
int naluLListLength(SniffStreamContext *sniffStreamContext);


/* ****************************************************************
 *
 *
 *
 *             4.Full HTTPFLV LIVE - Demuxer+Decoder
 *
 *
 *
 * ****************************************************************/
SniffHTTPFLVContext *AVSniffHttpFlvInit(const char *token, const char* version);

int releaseSniffHttpFlv(SniffHTTPFLVContext *sniffHttpFlvContext);

int initializeSniffHttpFlvModule(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        int ignoreAudio
);

int initializeSniffHttpFlvModuleWithAOpt(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*naluCallback)(void),
        long (*pcmCallback)(void),
        long (*aacCallback)(void),
        int ignoreAudio,
        MISSILE_SNIFFSTREAM_MODE mode
);

int pushSniffHttpFlvData(
        SniffHTTPFLVContext *sniffHttpFlvContext, uint8_t *buff, int in_len, int probe_size);
int getBufferLengthApi(SniffHTTPFLVContext *sniffHttpFlvContext);
int getSniffHttpFlvPkg(SniffHTTPFLVContext *sniffHttpFlvContext);
int getSniffHttpFlvPkgNoCheckProbe(SniffHTTPFLVContext *sniffHttpFlvContext);
int decodeHttpFlvVideoFrame(
        SniffHTTPFLVContext *sniffHttpFlvContext,
        uint8_t *buff, int len, long pts, long dts, int tag);
int releaseHttpFLV(SniffHTTPFLVContext *sniffHttpFlvContext);

/* ****************************************************************
 *
 *
 *
 *             4.Full G711 LIVE - Demuxer+Decoder
 *
 *
 *
 * ****************************************************************/
SniffG711CoreContext *AVSniffHttpG711Init(const char *token, const char* version);
int initializeSniffG711Module(
        SniffG711CoreContext *sniffG711CoreContext,
        long (*probeCallback)(void),
        long (*yuvCallback)(void),
        long (*pcmCallback)(void),
        int ignoreAudio,
        MISSILE_SNIFFSTREAM_MODE mode
);
int pushSniffG711FlvData(
        SniffG711CoreContext *sniffG711CoreContext, uint8_t *buff, int in_len, int probe_size);
int getG711BufferLengthApi(SniffG711CoreContext *sniffG711CoreContext);
int decodeG711Frame(SniffG711CoreContext *sniffG711CoreContext);
int releaseG711(SniffG711CoreContext *sniffG711CoreContext);

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_WEB_H
