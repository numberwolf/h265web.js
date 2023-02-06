//
// Created by 小老虎 on 2021/8/9.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SEEK_DESC_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SEEK_DESC_H

#define SEEK_STATUS_TYPE int

#define SEEK_STATUS_OPTION_IDLE 100
#define SEEK_STATUS_OPTION_BUSY 200

typedef struct SeekDesc {

    SEEK_STATUS_TYPE m_seekStatus;
    double m_seekPos;
    double m_seekBusyPos;

} SeekDesc;

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SEEK_DESC_H
