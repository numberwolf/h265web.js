//
// Created by 小老虎 on 2020/10/18.
//

#include "av_err_code.h"


const char* getCodeMsg(int code) {
    switch (code) {
        case AVERROR_BSF_NOT_FOUND:
            return AVERROR_BSF_NOT_FOUND_STR;
        case AVERROR_BUG:
            return AVERROR_BUG_STR;
        case AVERROR_BUFFER_TOO_SMALL:
            return AVERROR_BUFFER_TOO_SMALL_STR;
        case AVERROR_DECODER_NOT_FOUND:
            return AVERROR_DECODER_NOT_FOUND_STR;
        case AVERROR_DEMUXER_NOT_FOUND:
            return AVERROR_DEMUXER_NOT_FOUND_STR;
        case AVERROR_ENCODER_NOT_FOUND:
            return AVERROR_ENCODER_NOT_FOUND_STR;
        case AVERROR_EOF:
            return AVERROR_EOF_STR;
        case AVERROR_EXIT:
            return AVERROR_EXIT_STR;
        case AVERROR_EXTERNAL:
            return AVERROR_EXTERNAL_STR;
        case AVERROR_FILTER_NOT_FOUND:
            return AVERROR_FILTER_NOT_FOUND_STR;
        case AVERROR_INVALIDDATA:
            return AVERROR_INVALIDDATA_STR;
        case AVERROR_MUXER_NOT_FOUND:
            return AVERROR_MUXER_NOT_FOUND_STR;
        case AVERROR_OPTION_NOT_FOUND:
            return AVERROR_OPTION_NOT_FOUND_STR;
        case AVERROR_PATCHWELCOME:
            return AVERROR_PATCHWELCOME_STR;
        case AVERROR_PROTOCOL_NOT_FOUND:
            return AVERROR_PROTOCOL_NOT_FOUND_STR;
        case AVERROR_STREAM_NOT_FOUND:
            return AVERROR_STREAM_NOT_FOUND_STR;
    }
    return ERROR_UNKNOW_OR_KNOW_STR;
}

