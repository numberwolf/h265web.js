//
// Created by 小老虎 on 2022/5/15.
//

#ifndef FFMPEG_QUQI_ANALYZER_TE_DEMUXER_AV_DEC_LINKLIST_H
#define FFMPEG_QUQI_ANALYZER_TE_DEMUXER_AV_DEC_LINKLIST_H

#include <stdio.h>
#include <stdlib.h>

typedef struct AV_DEC_Nalu_Node {
    uint8_t *buff;
    int len;
    long pts;
    long dts;
    int tag;
    int skip;
    struct AV_DEC_Nalu_Node *prev;
    struct AV_DEC_Nalu_Node *next;
} AV_DEC_Nalu_Node;

typedef struct AV_DEC_Nalu_LinkList {
    int index;
    size_t length;

    AV_DEC_Nalu_Node *head;
} AV_DEC_Nalu_LinkList;

AV_DEC_Nalu_LinkList *AV_DEC_NaluLinkList_Create_By_Idx(int idx);
AV_DEC_Nalu_LinkList *AV_DEC_NaluLinkList_Create();
int AV_DEC_NaluLinkList_NodesData_Release(AV_DEC_Nalu_LinkList *linklist);
int AV_DEC_NaluLinkList_Release(AV_DEC_Nalu_LinkList *linklist);

int AV_DEC_NaluNode_Append(AV_DEC_Nalu_LinkList *linklist,
                           const uint8_t *buff, int len, long pts, long dts, int tag, int skip);
int AV_DEC_NaluNode_Append_SortDTS(AV_DEC_Nalu_LinkList *linklist,
        const uint8_t *buff, int len, long pts, long dts, int tag, int skip);
AV_DEC_Nalu_Node *AV_DEC_NaluNode_GetBeforeNodeByDTS(AV_DEC_Nalu_LinkList *linklist, long dts);
AV_DEC_Nalu_Node *AV_DEC_NaluNode_Pop_1st(AV_DEC_Nalu_LinkList *linklist);
int AV_DEC_NaluNode_Release(AV_DEC_Nalu_Node *node);

#endif //FFMPEG_QUQI_ANALYZER_TE_DEMUXER_AV_DEC_LINKLIST_H
