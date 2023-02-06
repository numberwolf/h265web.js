#include "ts_utils.h"
#include "tools.h"

//int
//STRCMP (const char *p1, const char *p2)
//{
//    const unsigned char *s1 = (const unsigned char *) p1;
//    const unsigned char *s2 = (const unsigned char *) p2;
//    unsigned char c1, c2;
//
//    do {
//        c1 = (unsigned char) *s1++;
//        c2 = (unsigned char) *s2++;
//        if(c1 == '\0')
//            return c1 - c2;
//    } while (c1 == c2);
//
//    return c1 - c2;
//}

uint32_t tsmuxerUtilSampleOffsetTable(uint8_t freqIdx) {
    for (int i = 0; i < 13; i++) {
        if (FREQ_OFFSET_TABLE[i] == freqIdx) {
            return SAMPLERATE_OFFSET_TABLE[i];
        }
    }    
    return 0;
}

/**
 * Get Codec uint32_t return value (convert)
 * @param codecName
 * @return 0:unknow others:codecID
 */
int32_t tsmuxerUtilCodecTable(const char *codecName) {
    for (int i = 0; i < CODEC_OFFSET_LENGTH; i++) {
//        printf("%s ?= %s\n", CODEC_NAME_OFFSET_TABLE[i], codecName);
        if (STRCMP(CODEC_NAME_OFFSET_TABLE[i], codecName) == 0) {
//            return CODEC_OFFSET_TABLE[i];
            return i;
        }
    }
    return -1;
}



