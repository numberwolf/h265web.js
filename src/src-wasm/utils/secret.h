//
// Created by 小老虎 on 2020/9/24.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SECRET_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SECRET_H

#define RANDOM_MAX 1000000
#define SIGN_INT_SPLIT_BASE 10000 // 签名算法过程的基础
#define SIGN_INT_SPLIT_BASE_LEN 4 // 签名算法过程的基础位

static const char *TOKEN_SECRET = "============>>>>>>>>>>>>>>Author:changyanlong|numberwolf,Github:https://github.com/numberwolf,Email:porschegt23@foxmail.com,QQ:531365872,HomePage:http://xvideo.video,Discord:numberwolf#8694,Beijing,WorkIn:Baidu<<<<<<<<<<<<===========";

static const char *TOKEN_FREE = "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1";

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_SECRET_H
