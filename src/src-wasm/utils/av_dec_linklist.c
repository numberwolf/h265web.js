//
// Created by 小老虎 on 2022/5/15.
//

#include <string.h>
#include "av_dec_linklist.h"

AV_DEC_Nalu_LinkList *AV_DEC_NaluLinkList_Create_By_Idx(int idx) {

    AV_DEC_Nalu_LinkList *linkList = (AV_DEC_Nalu_LinkList *) malloc(sizeof(AV_DEC_Nalu_LinkList));
    linkList->index = idx;
    linkList->head = NULL;
    linkList->length = 0;

    return linkList;
} // AV_DEC_NaluLinkList_Create_By_Idx


AV_DEC_Nalu_LinkList *AV_DEC_NaluLinkList_Create() {
    return AV_DEC_NaluLinkList_Create_By_Idx(0);
} // AV_DEC_NaluLinkList_Create

// @TODO
int AV_DEC_NaluLinkList_NodesData_Release(AV_DEC_Nalu_LinkList *linklist) {
    // AT力场
    if (linklist == NULL) {
        return -1;
    }

    // Do
    AV_DEC_Nalu_Node *ptr = linklist->head;
    while(ptr != NULL) {
        // free self members
        if (ptr->buff != NULL) {
            free(ptr->buff);
            ptr->buff = NULL;
        }

        if (ptr->next != NULL) {
            // to next
            ptr = ptr->next;
            // free before self
            if (ptr->prev != NULL) {
                free(ptr->prev);
                ptr->prev = NULL;
            }
        } else {
            // free self
            free(ptr);
            ptr = NULL;
            break;
        }
    } // end while

    linklist->head = NULL;
    linklist->length = 0;
    return 0;
} // AV_DEC_NaluLinkList_NodesData_Release

int AV_DEC_NaluLinkList_Release(AV_DEC_Nalu_LinkList *linklist) {
    // AT力场
    if (linklist == NULL) {
        return -1;
    }

    // Do
    int ret = AV_DEC_NaluLinkList_NodesData_Release(linklist);
    if (ret < 0) {
        return ret;
    }

    if (linklist->length > 0 || linklist->head != NULL) {
        return -2;
    }

    free(linklist);
    linklist = NULL;
    return 0;
} // AV_DEC_NaluLinkList_Release

int AV_DEC_NaluNode_Append(AV_DEC_Nalu_LinkList *linklist,
                           const uint8_t *buff, int len, long pts, long dts, int tag, int skip)
{
    // AT力场
    if (linklist == NULL) {
        return -1;
    }

    if (buff == NULL || len <= 0) {
        return -2;
    }

    if (pts < 0 || dts < 0) {
        return -3;
    }

    // Do
    // 0.build node
    AV_DEC_Nalu_Node *naluNode = (AV_DEC_Nalu_Node *) malloc(sizeof(AV_DEC_Nalu_Node));
    naluNode->buff = (uint8_t *) malloc(sizeof(uint8_t) * len);
    memcpy(naluNode->buff + 0, buff, len);
    naluNode->len = len;
    naluNode->pts = pts;
    naluNode->dts = dts;
    naluNode->tag = tag;
    naluNode->skip = skip;
    naluNode->prev = NULL;
    naluNode->next = NULL;

    // 1.append node to an empty link list
    if (linklist->head == NULL) {
        linklist->head = naluNode;
        linklist->length = 1;
    } else {
        AV_DEC_Nalu_Node *ptr = linklist->head;
        while (ptr != NULL) {
            if (ptr->next == NULL) {
                // insert to next
                ptr->next = naluNode;
                naluNode->prev = ptr;
                break;
            }
            ptr = ptr->next;
        } // end while
        linklist->length += 1;
    }

    return linklist->length;
} // AV_DEC_NaluNode_Append

int AV_DEC_NaluNode_Append_SortDTS(AV_DEC_Nalu_LinkList *linklist,
        const uint8_t *buff, int len, long pts, long dts, int tag, int skip)
{
    // AT力场
    if (linklist == NULL) {
        return -1;
    }

    if (buff == NULL || len <= 0) {
        return -2;
    }

    if (pts < 0 || dts < 0) {
        return -3;
    }

    // Do
    // 0.build node
    AV_DEC_Nalu_Node *naluNode = (AV_DEC_Nalu_Node *) malloc(sizeof(AV_DEC_Nalu_Node));
    naluNode->buff = (uint8_t *) malloc(sizeof(uint8_t) * len);
    memcpy(naluNode->buff + 0, buff, len);
    naluNode->len = len;
    naluNode->pts = pts;
    naluNode->dts = dts;
    naluNode->tag = tag;
    naluNode->skip = skip;
    naluNode->prev = NULL;
    naluNode->next = NULL;

    // 1.append node to an empty link list
    if (linklist->head == NULL) {
        linklist->head = naluNode;
        linklist->length = 1;
    } else {
        // 2.append node to insert link list by dts
        AV_DEC_Nalu_Node *prev_ptr = AV_DEC_NaluNode_GetBeforeNodeByDTS(linklist, dts);
        if (prev_ptr == NULL) {
            // set to first head
            /*
             * | naluNode(insert) [next]-> | <-[prev] ptr:old head [next]-> | xxx |
             */
            AV_DEC_Nalu_Node *ptr = linklist->head;
            ptr->prev = naluNode;
            naluNode->next = ptr;
            linklist->head = naluNode;

        } else {
            // set to prev's next
            naluNode->prev = prev_ptr;
            prev_ptr->next = naluNode;
        }


        linklist->length += 1;
    } // end 1.append node to an empty link list

    return linklist->length;
} // AV_DEC_NaluNode_Append_SortDTS

AV_DEC_Nalu_Node *AV_DEC_NaluNode_GetBeforeNodeByDTS(AV_DEC_Nalu_LinkList *linklist, long dts) {
    // AT力场
    if (linklist == NULL) {
        return NULL;
    }

    if (linklist->head == NULL) {
        return NULL;
    }

    if (dts < 0) {
        return NULL;
    }

    // Do
    AV_DEC_Nalu_Node *ptr = linklist->head;
    while(ptr != NULL) {
        if (ptr->dts < dts) {
            /*
             * | ptr dts | dts(after insert) | ptr->next dts|
             */
            if (ptr->next != NULL && ptr->next->dts > dts) {
                return ptr;
            }
            /*
             * | ptr dts | ptr(after insert) |
             */
            if (ptr->next == NULL) {
                return ptr;
            }
        } else {
            /*
             * | ptr->prev dts | dts(after insert) | ptr dts |
             */
            if (ptr->prev != NULL && ptr->prev->dts < dts) {
                return ptr->prev;
            }
            /*
             * | dts(after insert) | ptr dts |
             */
            if (ptr->prev == NULL) {
                return NULL;
            }
        } // end check conditions

        ptr = ptr->next;
    } // end while

    return NULL;
} // AV_DEC_NaluNode_GetBeforeNodeByDTS

AV_DEC_Nalu_Node *AV_DEC_NaluNode_Pop_1st(AV_DEC_Nalu_LinkList *linklist) {
    // AT力场
    if (linklist == NULL) {
        return NULL;
    }

    if (linklist->head == NULL || linklist->length <= 0) {
        return NULL;
    }

    // Do
    AV_DEC_Nalu_Node *ptr = linklist->head;

    // pop head
    if (linklist->head->next != NULL) {
        linklist->head = linklist->head->next;
        linklist->head->prev = NULL;
    } else {
        linklist->head = NULL;
    }

    linklist->length -= 1;

    ptr->next = NULL;
    ptr->prev = NULL;

    return ptr;
} // AV_DEC_NaluNode_Pop_1st

int AV_DEC_NaluNode_Release(AV_DEC_Nalu_Node *node) {
    if (node == NULL) {
        return 0;
    }

    if (node->buff != NULL) {
        free(node->buff);
        node->buff = NULL;
    }

    free(node);
    node = NULL;

    return 0;
} // AV_DEC_NaluNode_Release

