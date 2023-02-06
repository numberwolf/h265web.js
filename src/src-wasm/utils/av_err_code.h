//
// Created by 小老虎 on 2020/10/18.
//

#ifndef FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_AV_ERR_CODE_H
#define FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_AV_ERR_CODE_H

/*
    #if EDOM > 0
        #define AVERROR(e) (-(e))   ///< Returns a negative error code from a POSIX error code, to return from library functions.
        #define AVUNERROR(e) (-(e)) ///< Returns a POSIX error code from a library function error return value.
    #else
        // Some platforms have E* and errno already negated.
        #define AVERROR(e) (e)
        #define AVUNERROR(e) (e)
    #endif

    #define FFERRTAG(a, b, c, d) (-(int)MKTAG(a, b, c, d))

    #define AVERROR_BSF_NOT_FOUND      FFERRTAG(0xF8,'B','S','F') ///< Bitstream filter not found
    #define AVERROR_BUG                FFERRTAG( 'B','U','G','!') ///< Internal bug, also see AVERROR_BUG2
    #define AVERROR_BUFFER_TOO_SMALL   FFERRTAG( 'B','U','F','S') ///< Buffer too small
    #define AVERROR_DECODER_NOT_FOUND  FFERRTAG(0xF8,'D','E','C') ///< Decoder not found
    #define AVERROR_DEMUXER_NOT_FOUND  FFERRTAG(0xF8,'D','E','M') ///< Demuxer not found
    #define AVERROR_ENCODER_NOT_FOUND  FFERRTAG(0xF8,'E','N','C') ///< Encoder not found
    #define AVERROR_EOF                FFERRTAG( 'E','O','F',' ') ///< End of file
    #define AVERROR_EXIT               FFERRTAG( 'E','X','I','T') ///< Immediate exit was requested; the called function should not be restarted
    #define AVERROR_EXTERNAL           FFERRTAG( 'E','X','T',' ') ///< Generic error in an external library
    #define AVERROR_FILTER_NOT_FOUND   FFERRTAG(0xF8,'F','I','L') ///< Filter not found
    #define AVERROR_INVALIDDATA        FFERRTAG( 'I','N','D','A') ///< Invalid data found when processing input
    #define AVERROR_MUXER_NOT_FOUND    FFERRTAG(0xF8,'M','U','X') ///< Muxer not found
    #define AVERROR_OPTION_NOT_FOUND   FFERRTAG(0xF8,'O','P','T') ///< Option not found
    #define AVERROR_PATCHWELCOME       FFERRTAG( 'P','A','W','E') ///< Not yet implemented in FFmpeg, patches welcome
    #define AVERROR_PROTOCOL_NOT_FOUND FFERRTAG(0xF8,'P','R','O') ///< Protocol not found

    #define AVERROR_STREAM_NOT_FOUND   FFERRTAG(0xF8,'S','T','R') ///< Stream not found
 */

#define ERROR_UNKNOW_OR_KNOW_STR "unknow or none"

#define AVERROR_BSF_NOT_FOUND -1179861752
#define AVERROR_BSF_NOT_FOUND_STR "bsf not found"

#define AVERROR_BUG -558323010
#define AVERROR_BUG_STR "bug"

#define AVERROR_BUFFER_TOO_SMALL -1397118274
#define AVERROR_BUFFER_TOO_SMALL_STR "buffer too small"

#define AVERROR_DECODER_NOT_FOUND -1128613112
#define AVERROR_DECODER_NOT_FOUND_STR "decoder not found"

#define AVERROR_DEMUXER_NOT_FOUND -1296385272
#define AVERROR_DEMUXER_NOT_FOUND_STR "demuxer not found"

#define AVERROR_ENCODER_NOT_FOUND -1129203192
#define AVERROR_ENCODER_NOT_FOUND_STR "encoder not found"

#define AVERROR_EOF -541478725
#define AVERROR_EOF_STR "err eof"

#define AVERROR_EXIT -1414092869
#define AVERROR_EXIT_STR "err exit"

#define AVERROR_EXTERNAL -542398533
#define AVERROR_EXTERNAL_STR "external"

#define AVERROR_FILTER_NOT_FOUND -1279870712
#define AVERROR_FILTER_NOT_FOUND_STR "filter not found"

#define AVERROR_INVALIDDATA -1094995529
#define AVERROR_INVALIDDATA_STR "invalid data"

#define AVERROR_MUXER_NOT_FOUND -1481985528
#define AVERROR_MUXER_NOT_FOUND_STR "muxer not found"

#define AVERROR_OPTION_NOT_FOUND -1414549496
#define AVERROR_OPTION_NOT_FOUND_STR "option not found"

#define AVERROR_PATCHWELCOME -1163346256
#define AVERROR_PATCHWELCOME_STR "patch welcome"

#define AVERROR_PROTOCOL_NOT_FOUND -1330794744
#define AVERROR_PROTOCOL_NOT_FOUND_STR "protocol not found"

#define AVERROR_STREAM_NOT_FOUND -1381258232
#define AVERROR_STREAM_NOT_FOUND_STR "stream not found"

const char* getCodeMsg(int code);

#endif //FFMPEG_QUQI_ANALYZER_HTTP_DEMUXER_AV_ERR_CODE_H
