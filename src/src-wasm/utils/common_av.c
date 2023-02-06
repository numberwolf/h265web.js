//
// Created by 小老虎 on 2021/3/14.
//

#include <math.h>
#include "common_av.h"

int find_sample_index(int samplerate)
{
    int adts_sample_rates[] = {96000,882000,64000,48000,44100,32000,24000,22050,16000,12000,11025,8000,7350,0,0,0};
    int i;
    for(i=0; i < 16;i++)
    {
        if(samplerate == adts_sample_rates[i])
            return i;
    }
    return 16 - 1;
}

double pts_fixed_2(double pts) {
    return ceil(pts * 100.0) / 100.0;
}
