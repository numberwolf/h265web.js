/********************************************************* 
 * LICENSE: LICENSE-Free_CN.MD
 * 
 * Author: Numberwolf - ChangYanlong
 * QQ: 531365872
 * QQ Group:925466059
 * Wechat: numberwolf11
 * Discord: numberwolf#8694
 * E-Mail: porschegt23@foxmail.com
 * Github: https://github.com/numberwolf/h265web.js
 * 
 * 作者: 小老虎(Numberwolf)(常炎隆)
 * QQ: 531365872
 * QQ群: 531365872
 * 微信: numberwolf11
 * Discord: numberwolf#8694
 * 邮箱: porschegt23@foxmail.com
 * 博客: https://www.jianshu.com/u/9c09c1e00fd1
 * Github: https://github.com/numberwolf/h265web.js
 * 
 **********************************************************/
const MP4Box = require('mp4box');
const HEVDEF = require('../decoder/hevc-header');
const HEVDEFIMP = require('../decoder/hevc-imp');
const BUFFMOD = require('./buffer');
const DEF = require('../consts');
// const STARTCODE = new Uint8Array([0, 0, 0, 1])
const SAMPLEINDEX = {
    96000 : 0x00,
    88200 : 0x01,
    64000 : 0x02,
    48000 : 0x03,
    44100 : 0x04,
    32000 : 0x05,
    24000 : 0x06,
    22050 : 0x07,
    16000 : 0x08,
    12000 : 0x09,
    11025 : 0x0a,
    8000 : 0x0b,
    7350 : 0x0c,
    'Reserved' : 0x0d, // == 0x0e
    'frequency is written explictly' : 0x0f
};

const DEBUG_U8_2_HEX = (u8arr) => {
    let hexArr = [];
    for (let i = 0; i < u8arr.length; i++) {
        hexArr.push(u8arr[i].toString(16));
    }
    return hexArr;
};

const CHECK_VPS_EQUAL = (u1, u2) => {
    if (u1.length !== u2.length) {
        return false;
    }

    const CHECK_LEN = 100;
    for (let i = 0; i < u1.length; i++) {
        if (i >= CHECK_LEN) {
            break;
        }
        if (u1[i] !== u2[i]) {
            return false;
        }
    }

    return true;
};

function Mp4Parser() {
    // Class Object
}

/*
 * Add start code 0x00 0x00 0x00 0x01
 */
Mp4Parser.prototype.setStartCode = function(dataStream, replace=false) {
    let returnStream = null;
    if (replace) {
        returnStream    = dataStream;
        returnStream[0] = HEVDEF.DEFINE_STARTCODE[0];
        returnStream[1] = HEVDEF.DEFINE_STARTCODE[1];
        returnStream[2] = HEVDEF.DEFINE_STARTCODE[2];
        returnStream[3] = HEVDEF.DEFINE_STARTCODE[3];
    } else {
        returnStream = new Uint8Array(HEVDEF.DEFINE_STARTCODE.length + dataStream.length);
        returnStream.set(HEVDEF.DEFINE_STARTCODE, 0);
        returnStream.set(dataStream, HEVDEF.DEFINE_STARTCODE.length);
    }

    return returnStream;
}

/** 
  * 添加ADTS头 
  * 
  * @param packet 
  * @param packetLen 

 private void addADTStoPacket(byte[] packet, int packetLen) {  
     int profile = 2; // AAC LC  
     int freqIdx = 4; // 44.1KHz  
     int chanCfg = 2; // CPE  
  
     // fill in ADTS data  
     packet[0] = (byte) 0xFF;  
     packet[1] = (byte) 0xF9;  
     packet[2] = (byte) (((profile - 1) << 6) + (freqIdx << 2) + (chanCfg >> 2));  
     packet[3] = (byte) (((chanCfg & 3) << 6) + (packetLen >> 11));  
     packet[4] = (byte) ((packetLen & 0x7FF) >> 3);  
     packet[5] = (byte) (((packetLen & 7) << 5) + 0x1F);  
     packet[6] = (byte) 0xFC;  
 }  
  */  
Mp4Parser.prototype.setAACAdts = function(dataStream) {
    let returnStream    = null;
    /*
        00 - NULL
        01 - AAC Main (a deprecated AAC profile from MPEG-2)
        02 - AAC LC or backwards compatible HE-AAC (Most realworld AAC falls in one of these cases)
        03 - AAC Scalable Sample Rate (rarely used)
        03 - AAC LTP (a replacement for AAC Main, rarely used)
        05 - HE-AAC explicitly signaled (Non-backward compatible)
        22 - ER BSAC (A Korean broadcast codec)
        23 - Low Delay AAC
        29 - HE-AACv2 explicitly signaled (In one draft this was MP3On4 instead)
        31 - ESCAPE (read 6 more bits, add 32)
        32 - MP3on4 Layer 1
        33 - MP3on4 Layer 2
        34 - MP3on4 Layer 3
    */
    // var profile         = 2; // AAC LC
    let profile         = this.aacProfile;
    // var freqIdx         = 4; // 4:44.1KHz  8:16KHz
    let freqIdx         = SAMPLEINDEX[this.sampleRate];
    let chanCfg         = 2; // CPE  
    // //console.log(profile, freqIdx);

    /*
   ff       f1         50     40       01       7f       fc       --> 01182007
11111111 11110001 01010000 0100 0000 00000001 01111111 11111100
|---12bits--|
                               |
|------------- 28bits----------|-----------------28 bits-------|
                                 |00 00000001 011| = pkt length = 1011 = 11 (bytes)
                                 --------------------------------------------------
                                 |     ff f1 50 40 01 7f fc 01 18 20 07 <- 11 bytes

   ff       f1              50                 40       01       7f       fc       --> 01182007
11111111|1111 0  00  1  | 01     0100 0  0|01 0   0  00 [00|00000001|011] 11111|111111  00
|---12bits--| 1b 2b  1b   2b      4b  1b  3b  1b  1b          13b             11b       2b
      v       v           v        v              v           v               v
   syncword  ID          profile  freq           home        pkt_len         fullness
    */
    let adtsHead        = new Uint8Array(7);
    let packetLen       = adtsHead.length + dataStream.length;
    // [0xff, 0xf1, 0x50, 0x40, 0x0b, 0x9f, 0xfc]
    adtsHead[0] = 0xff;
    adtsHead[1] = 0xf1;

    adtsHead[2] = (((profile - 1) << 6) + (freqIdx << 2) + (chanCfg >> 2));

    adtsHead[3] = (((chanCfg & 3) << 6) + (packetLen >> 11));  

    adtsHead[4] = ((packetLen & 0x7FF) >> 3);

    adtsHead[5] = (((packetLen & 7) << 5) + 0x1F);

    adtsHead[6] = 0xfc;  

    returnStream = new Uint8Array(packetLen);
    returnStream.set(adtsHead, 0);
    returnStream.set(dataStream, adtsHead.length);

    return returnStream;
}

/**
 * @param ArrayBuffer dataStream
 */
// Mp4Parser.prototype.demux = function(dataStream) {
//     var _this = this;
//     dataStream.fileStart= 0;
Mp4Parser.prototype.demux = function() {
    let _this = this;

    _this.seekPos       = -1;
    _this.mp4boxfile    = MP4Box.createFile();
    _this.movieInfo     = null; // mp4box init object

    _this.videoCodec    = null;
    // _this.audioCodec    = null;

    _this.durationMs    = -1.0;
    _this.fps           = -1;
    _this.sampleRate    = -1;
    _this.aacProfile    = 2; // LC
    _this.size          = {
        width   : -1,
        height  : -1
    };
    _this.bufObject     = BUFFMOD();
    _this.audioNone     = false;
    // _this.videoNone     = false;
    // _this.video_start_time = -1;
    // _this.audio_start_time = -1;

    _this.naluHeader    = {
        vps: null,
        sps: null,
        pps: null,
        sei: null
    };

    /*
     * item : {pts: 0, frame: Uint8Array}
     */
    // _this.trackVideos   = [];
    // _this.trackAudios   = [];

    //var mp4boxfile = MP4Box.createFile();
    _this.mp4boxfile.onError = function(e) {
        console.log(e);
    };

    this.mp4boxfile.onReady = function(info) {
        console.log(info);
        _this.movieInfo = info;

        for (let key in info.tracks) {
            if (info.tracks[key].name === 'VideoHandler' 
                || info.tracks[key].type === 'video') {
                console.log("CODEC===============>" + info.tracks[key].codec);
                // console.log(info.tracks[key]);
                if (info.tracks[key].codec.indexOf('hev') >= 0 
                    || info.tracks[key].codec.indexOf('hvc') >= 0) {
                    _this.videoCodec = DEF.CODEC_H265;
                    //console.log(" IS H265==================== ");
                } else if (info.tracks[key].codec.indexOf('avc') >= 0) {
                    _this.videoCodec = DEF.CODEC_H264;
                    //console.log(" IS H264==================== ");
                }
            }
        }

        /*
        {
          hasMoov: true,
          duration: 55752,
          timescale: 1000,
          isFragmented: false,
          isProgressive: false,
          hasIOD: false,
          brands: [ 'isom', 'isom', 'iso2', 'mp41' ],
          created: 1904-01-01T00:00:00.000Z,
          modified: 1904-01-01T00:00:00.000Z,
          tracks: [
            {
              movie_duration: 50520,
              movie_timescale: 1000,
              layer: 0,
              alternate_group: 0,
              volume: 0,
              matrix: [Int32Array],
              track_width: 576,
              track_height: 240,
              timescale: 12800,
              cts_shift: undefined,
              duration: 646656,
              samples_duration: 646656,
              ...
        */
        // //console.log("start calcute");
        let tmpDurationSec = -1.0;
        if (1 == 0) { // info.duration > 0
            tmpDurationSec = (info.duration / info.timescale);
        } else {
            // tmpDurationSec = 1000 * (info.tracks[0].samples_duration / info.tracks[0].timescale);
            tmpDurationSec = (info.videoTracks[0].samples_duration / info.videoTracks[0].timescale);
            // //console.log(info.videoTracks[0].samples_duration);
            // //console.log(info.videoTracks[0].timescale);
        }

        // //console.log(tmpDurationSec, 1000 * tmpDurationSec);
        // //console.log(info.videoTracks[0].nb_samples, info.videoTracks[0].nb_samples / tmpDurationSec);
        
        _this.durationMs        = 1000 * tmpDurationSec;
        _this.fps               = info.videoTracks[0].nb_samples / tmpDurationSec;
        // //console.log(_this.durationMs, _this.fps);
        _this.seekDiffTime      = 1 / _this.fps;

        _this.size["width"]     = info.videoTracks[0].track_width;
        _this.size["height"]    = info.videoTracks[0].track_height;

        if (info.audioTracks.length > 0) {
            _this.sampleRate        = info.audioTracks[0].audio.sample_rate;
            // codec: 'mp4a.40.5'  profile=5 HE-AAC
            let audioCodecDesc      = info.audioTracks[0].codec.split(".");
            _this.aacProfile        = audioCodecDesc[audioCodecDesc.length-1];
        } else {
            _this.audioNone = true;
        }
        
        if (_this.onMp4BoxReady != null) {
            _this.onMp4BoxReady(_this.videoCodec);
        }
        
        if (_this.videoCodec === DEF.CODEC_H265) {
            _this.initializeAllSourceBuffers();
            _this.mp4boxfile.start();
        } else if (_this.videoCodec === DEF.CODEC_H264) {
            // todo
        }
    };

    _this.mp4boxfile.onSamples = function (id, user, samples) {
        let loop1 = window.setInterval(() => {
            for (let i = 0; i < samples.length; i++) {
                let sample  = samples[i];
                let data    = sample.data;
                let frame   = null;
                if (data == null || data.length < 4 || !data) {
                    continue;
                }

                let pts = (sample.dts) / sample.timescale;
                if (id === 1) {
                    console.log("_this.mp4boxfile.onSamples id,pts ==>", id, pts);
                    /*
                     * 针对265的NALU填充
                     */
                    let codecContext = null;
                    // let isKey = false;
                    let isKey = sample.is_sync;
                    // //console.log(_this.videoCodec);
                    if (_this.videoCodec === DEF.CODEC_H265) {
                        codecContext = sample.description.hvcC;
                        let frameType = HEVDEFIMP.GET_NALU_TYPE(data[4]);
                        // isKey = frameType == HEVDEF.DEFINE_KEY_FRAME ? true : false;
                        /*
                         * @todo 这里需要兼容一种已经有了VPS SPS PPS的数据!!!
                         */
                        // if (isKey) { // test
                        //     console.log("--sample------->", id, pts);
                        //     for (let j = 0; j < data.length; j++) {
                        //         console.log(data[j]);
                        //     }

                        //     // --sample=======> true 21 21
                        //     console.log("--sample=======>", sample.is_sync, frameType, HEVDEF.DEFINE_KEY_FRAME);
                        //     // --sample=======> 0 0 136 10 40
                        //     //                  0 0 136 28 42
                        //     //                  0 0 127 16 42
                        //     console.log("--sample=======>", data[0], data[1], data[2], data[3], data[4]);
                        //     return;
                        // }


                        if (!isKey) {
                            isKey = frameType == HEVDEF.DEFINE_KEY_FRAME ? 
                                true : sample.is_sync;
                        }
                        // isKey = sample.is_sync;
                    } else if (_this.videoCodec === DEF.CODEC_H264) {
                        codecContext = sample.description.avcC;
                        // isKey = sample.is_sync;
                    }
                    // //console.log(samples[i].data);
                    // //console.log(codecContext);
                    

                    if (isKey) { // isKey

                        // @TODO 这里必须每次都获取!! 需要改的优雅一些，当前时间不够了
                        if (true || _this.naluHeader.vps === null
                            || _this.naluHeader.sps === null
                            || _this.naluHeader.pps === null
                            || _this.naluHeader.sei === null) {

                            if (_this.videoCodec == DEF.CODEC_H265) {
                                //console.log(data, data[4]);
                                let naluArr = codecContext.nalu_arrays;
                                //console.log("NALU_ARR =>", naluArr);
                                // 64, 1, 12, 1, 255, 255, 1, 96, 0, 0, 3, 0, 144, 0, 0, 3, 0, 0, 3, 0, 63, 149, 152, 9
                                // 0, 0, 0, 1, 64, 1, 12, 78, 1, 5, 255, 255, 255,
                                _this.naluHeader.vps = _this.setStartCode(naluArr[0][0].data, false);
                                _this.naluHeader.sps = _this.setStartCode(naluArr[1][0].data, false);
                                _this.naluHeader.pps = _this.setStartCode(naluArr[2][0].data, false);
                                if (naluArr.length > 3) {
                                    _this.naluHeader.sei = _this.setStartCode(naluArr[3][0].data, false);
                                } else {
                                    _this.naluHeader.sei = new Uint8Array();
                                }

                                console.log("NALU_ARR =>", _this.naluHeader);

                            } else if (_this.videoCodec == DEF.CODEC_H264) {
                                _this.naluHeader.vps = new Uint8Array();
                                _this.naluHeader.sps = _this.setStartCode(codecContext.SPS[0].nalu, false);
                                _this.naluHeader.pps = _this.setStartCode(codecContext.PPS[0].nalu, false);
                                _this.naluHeader.sei = new Uint8Array();
                            }
                        } // end if nalu empty

                        // if bilibili header, remove mdat key frame's nalu fake header
                        // let naluLen = naluVPS.length 
                        // + naluSPS.length 
                        // + naluPPS.length 
                        // + naluSEI.length;

                        console.log("------------CHECK SUB", 
                            data[4].toString(16), 
                            _this.naluHeader.vps[4].toString(16), 
                            DEBUG_U8_2_HEX(_this.naluHeader.vps), 
                            DEBUG_U8_2_HEX(data)
                        );

                        let vpsBody = _this.setStartCode(data.subarray(0, _this.naluHeader.vps.length), true);
                        console.log("--------data vps body ", DEBUG_U8_2_HEX(vpsBody));

                        // badcase:CmUhCWDK4HCIOZEBAEuU4qjMnZAAACUxgLkF-QAS5T6731.mp4
                        // if (CHECK_VPS_EQUAL(
                        //         vpsBody, _this.naluHeader.vps) === false) {
                        //     console.log("--------data vps body not equal");
                        //     console.log(vpsBody, _this.naluHeader.vps);

                        //     _this.naluHeader.vps = null;
                        //     _this.naluHeader.vps = new Uint8Array(vpsBody);
                        // }
                        if (data[4] === _this.naluHeader.vps[4]) {

                            /*
                             * bd265特殊case
                             * bd265_540p_20210513165027_.mp4
                             * mdat --> include vps+sps+pps+sei
                             * header sei=empty
                             */
                            let checkVPSIdx = 4;
                            let checkSPSIdx = _this.naluHeader.vps.length + 4;
                            let checkPPSIdx = _this.naluHeader.vps.length 
                                + _this.naluHeader.sps.length + 4;
                            let checkSEIIdx = _this.naluHeader.vps.length 
                                + _this.naluHeader.sps.length 
                                + _this.naluHeader.pps.length + 4;
                            if (_this.naluHeader.sei.length <= 0 &&
                                (
                                    _this.naluHeader.sps.length > 0 &&
                                    data[checkSPSIdx] === _this.naluHeader.sps[4]
                                ) &&
                                (
                                    _this.naluHeader.pps.length > 0 &&
                                    data[checkPPSIdx] === _this.naluHeader.pps[4]
                                ) &&
                                (
                                    data[checkSEIIdx] === 0x4e
                                )
                            ) {
                                console.log("sei empty 0x4e, ");
                                console.log("sei empty 0x4e", 
                                    data[_this.naluHeader.vps.length + 4], 
                                    _this.naluHeader.sps[4],
                                    data[_this.naluHeader.vps.length 
                                        + _this.naluHeader.sps.length + 4],
                                    _this.naluHeader.pps[4],
                                    data[_this.naluHeader.vps.length 
                                        + _this.naluHeader.sps.length 
                                        + _this.naluHeader.pps.length + 4],
                                    0x4e
                                );

                                let endSeiIdx = 0;
                                for (let seiI = 0; seiI < data.length; seiI++) {
                                    if (data[seiI] === HEVDEF.SOURCE_CODE_SEI_END
                                        && HEVDEFIMP.GET_NALU_TYPE(data[seiI+5]) === HEVDEF.DEFINE_KEY_FRAME
                                    ) {
                                        endSeiIdx = seiI;
                                        break;
                                    }
                                }

                                // _this.naluHeader.sei = data.subarray(0, endSeiIdx+1);
                                // data = new Uint8Array(data.subarray(endSeiIdx + 1));
                                console.log("sei empty 0x4e FIN SUB SEI, then SEI:", endSeiIdx);

                                console.log("ok 0x4e");
                                data[checkVPSIdx - 1] = 0x01;
                                data[checkSPSIdx - 1] = 0x01;
                                data[checkPPSIdx - 1] = 0x01;
                                data[checkSEIIdx - 1] = 0x01;

                                data[checkVPSIdx - 2] = 0x00;
                                data[checkSPSIdx - 2] = 0x00;
                                data[checkPPSIdx - 2] = 0x00;
                                data[checkSEIIdx - 2] = 0x00;

                                data[checkVPSIdx - 3] = 0x00;
                                data[checkSPSIdx - 3] = 0x00;
                                data[checkPPSIdx - 3] = 0x00;
                                data[checkSEIIdx - 3] = 0x00;

                                data[endSeiIdx + 1] = 0x00;
                                data[endSeiIdx + 2] = 0x00;
                                data[endSeiIdx + 3] = 0x00;
                                data[endSeiIdx + 4] = 0x01;

                                _this.naluHeader.vps = null;
                                _this.naluHeader.sps = null;
                                _this.naluHeader.pps = null;
                                _this.naluHeader.vps = new Uint8Array();
                                _this.naluHeader.sps = new Uint8Array();
                                _this.naluHeader.pps = new Uint8Array();

                            } else {
                                /*
                                let vpsBody = _this.setStartCode(data.subarray(0, _this.naluHeader.vps.length), true);
                                console.log("--------data vps body ", DEBUG_U8_2_HEX(vpsBody));

                                // badcase:CmUhCWDK4HCIOZEBAEuU4qjMnZAAACUxgLkF-QAS5T6731.mp4
                                if (CHECK_VPS_EQUAL(
                                        vpsBody, _this.naluHeader.vps) === false) 
                                {
                                    console.log("--------data vps body not equal");
                                    console.log(vpsBody, _this.naluHeader.vps);

                                    let endSeiIdx = -1;
                                    let startFindEndTag = false;
                                    for (let i = 0; i < data.length; i++) {

                                        if (startFindEndTag === true && 
                                            data[i] === HEVDEF.SOURCE_CODE_SEI_END) {
                                            endSeiIdx = i;
                                            console.log("---------- data find sei end tag idx:", 
                                                endSeiIdx, data[i].toString(16));
                                            break;
                                        }

                                        const idx1 = i; // 0
                                        const idx2 = i + 1; // 0
                                        const idx3 = i + 2; // 0
                                        // const idx4 = i + 3; // 1 ? n
                                        const idx5 = i + 4; // sei tag

                                        if (idx5 >= data.length) {
                                            console.log("---------- data cannot sei ", idx5, HEVDEF.SOURCE_CODE_SEI.toString(16));
                                            break;
                                        }

                                        if (data[idx1] === 0x00 &&
                                            data[idx2] === 0x00 && 
                                            data[idx3] === 0x00 &&
                                            data[idx5] === HEVDEF.SOURCE_CODE_SEI) { // suc
                                            console.log("---------- data find sei start tag idx:", 
                                                idx5, data[idx5].toString(16));
                                            startFindEndTag = true;
                                            i = idx5;
                                        }
                                    }

                                    if (startFindEndTag && endSeiIdx > 0) {
                                        let vpsPre = data.subarray(0, endSeiIdx + 1);
                                        console.log("---------- vpsPre", DEBUG_U8_2_HEX(vpsPre));
                                        // find successed
                                        data = _this.setStartCode(data.subarray(endSeiIdx + 1), true);
                                        console.log("---------- after sub data", DEBUG_U8_2_HEX(data));

                                        let oldVPS = new Uint8Array(_this.naluHeader.vps);

                                        _this.naluHeader.vps = new Uint8Array(vpsPre.length + oldVPS.length);
                                        _this.naluHeader.vps.set(vpsPre, 0);
                                        _this.naluHeader.vps.set(oldVPS, vpsPre.length);
                                    }

                                    // _this.naluHeader.vps = null;
                                    // _this.naluHeader.vps = new Uint8Array(vpsBody);

                                    // find 

                                } else {
                                */
                                    /*
                                     * bilibili badcase
                                     * 针对B站这种自带SPS PPS头数据的 做下兼容
                                     * 这种case属于 mdat也自带NALU header信息，长度相同，但是mdat里面对于start code没有做替换，所以需要替换一下
                                     */
                                    console.log("------------SUBARRAY-NALU", 
                                        data[4].toString(16), 
                                        _this.naluHeader.vps[4].toString(16), 
                                        DEBUG_U8_2_HEX(_this.naluHeader.vps), 
                                        DEBUG_U8_2_HEX(data));
                                    // let tmpData = new Uint8Array(data.length - naluLen);
                                    // tmpData.set(data.subarray(naluLen));

                                    data = data.subarray(_this.naluHeader.vps.length 
                                    + _this.naluHeader.sps.length 
                                    + _this.naluHeader.pps.length 
                                    + _this.naluHeader.sei.length);
                                // }
                            }
                        } else if (_this.naluHeader.sei.length > 4 
                            && data[4] === _this.naluHeader.sei[4]) {
                            /*
                             * 兼容haokan的特殊case 具体还得改一下 这里好暂时我也不知道为啥是10
                             * 把mdat key frame前10补充到最前面
                             原本 0000 0001 4e01 0601 d080 是在mdat的
0000 0001 4e01 0601 d080 0000 0001 4001
0c01 ffff 0160 0000 0300 9000 0003 0000
0300 5d99 9809 0000 0001 4201 0101 6000
0003 0090 0000 0300 0003 005d a005 a200
5016 5999 a493 2b80 4000 0003 0040 0000
0642 0000 0001 4401 c173 d189 0000 0001
4e01 05ff ffff 602c a2de 09b5 1747 dbbb
55a4 fe7f c2fc 4e78 3236 3520 2862 7569
6c64 2035 3929 202d 2031 2e37 3a5b 4c69
6e75 785d 5b47 4343 2034 2e38 2e32 5d5b
3634 2062 6974 5d20 3862 7070 202d 2048
2e32 3635 2f48 4556 4320 636f 6465 6320
2d20 436f 7079 7269 6768 7420 3230 3133
                             */
                            // console.log("------------SUBARRAY-SEI", data[4], naluVPS[4], naluVPS, data);
                            // data = data.subarray(naluSEI.length);
                            const APPEND_BEFORE_VPS_SEI_DATA_LEN = 10; // 10bytes
                            let tmp1 = data.subarray(0, APPEND_BEFORE_VPS_SEI_DATA_LEN);
                            let newVPS = new Uint8Array(_this.naluHeader.vps.length + tmp1.length);
                            newVPS.set(tmp1, 0);
                            newVPS.set(_this.naluHeader.vps, tmp1.length);
                            newVPS[3] = 0x01;
                            _this.naluHeader.vps = null;
                            _this.naluHeader.vps = new Uint8Array(newVPS);
                            newVPS = null;
                            tmp1 = null;

                            data = data.subarray(APPEND_BEFORE_VPS_SEI_DATA_LEN);
                            console.log("------------FIN SUB SEI, then VPS:", data[4], _this.naluHeader.vps[4], _this.naluHeader.vps, data);

                        } else if(_this.naluHeader.sei.length === 0 
                            && data[4] === 0x4e) { // sei
                            data = _this.setStartCode(data, true);

                            let endSeiIdx = 0;
                            for (let seiI = 0; seiI < data.length; seiI++) {
                                if (data[seiI] === HEVDEF.SOURCE_CODE_SEI_END
                                    && HEVDEFIMP.GET_NALU_TYPE(data[seiI+5]) === HEVDEF.DEFINE_KEY_FRAME
                                ) {
                                    endSeiIdx = seiI;
                                    break;
                                }
                            }

                            _this.naluHeader.sei = data.subarray(0, endSeiIdx+1);
                            data = new Uint8Array(data.subarray(endSeiIdx + 1));
                            console.log("------------FIN SUB SEI, then SEI:", endSeiIdx, _this.naluHeader.sei, data);

                        }

                        /*
                        vps
40 01 0c 01 ff ff 01 60 00 00 03 00 90 00 00 03 00 
00 03 00 5d 99 98 09 21 00 01 00 28
sps
42 01 01 01 60 00 00 03 00 90 00 00 03 00 00 03 
00 5d a0 05 a2 00 50 16 59 99 a4 93 2b 80 40 00 
00 03 00 40 00 00 06 42 22 00 01 00 06 
pps
44 01 c1 73 d1 89 27 00 01 03 65 
sei
*/
                        console.log("naluVPS ===>", 
                            DEBUG_U8_2_HEX(_this.naluHeader.vps));
                        console.log("naluSPS ===>", 
                            DEBUG_U8_2_HEX(_this.naluHeader.sps));
                        console.log("naluPPS ===>", 
                            DEBUG_U8_2_HEX(_this.naluHeader.pps));
                        console.log("naluSEI ===>", 
                            DEBUG_U8_2_HEX(_this.naluHeader.sei));
                        console.log("data ===>", 
                            DEBUG_U8_2_HEX(data));

                        // frame = new Uint8Array(
                        //     data.length
                        // );
                        // frame.set(_this.setStartCode(data, true), 0);

                        frame = new Uint8Array(
                            _this.naluHeader.vps.length 
                            + _this.naluHeader.sps.length 
                            + _this.naluHeader.pps.length 
                            + _this.naluHeader.sei.length 
                            + data.length
                        );
                        frame.set(_this.naluHeader.vps, 0);

                        frame.set(_this.naluHeader.sps, 
                            _this.naluHeader.vps.length);

                        frame.set(_this.naluHeader.pps, 
                            _this.naluHeader.vps.length + 
                            _this.naluHeader.sps.length);

                        frame.set(_this.naluHeader.sei, 
                            _this.naluHeader.vps.length + 
                            _this.naluHeader.sps.length + 
                            _this.naluHeader.pps.length);

                        frame.set(_this.setStartCode(data, true), 
                            _this.naluHeader.vps.length + 
                            _this.naluHeader.sps.length + 
                            _this.naluHeader.pps.length + 
                            _this.naluHeader.sei.length);
                        console.log("---- frame==>", frame);
                    } else {
                        frame = _this.setStartCode(data, true);
                    }
                    // //console.log(frame);
                    _this.bufObject.appendFrame(pts, frame, true, isKey);
                    console.log("_this.bufObject.appendFrame==>", pts);

                } else if (id == 2) {
                    /*
                     * esds
         first line -- -- --  3  e  s  d  s -- -- -- -- 开始
                    00 00 00 33 65 73 64 73 00 00 00 00 03 80 80 80     ...3esds........
                    22 00 02 00 04 80 80 80 14 40 15 00 00 00 00 00     "........@......
                    80 00 00 00 7F CA 05 80 80 80 02 12 08 06 80 80     ...............
                    80 01 02                                            ...
                    */
                    // var esdsParseData = sample.description.esds.data;
                    // _this.trackAudios.push(data);
                    frame = _this.setAACAdts(data);
                    _this.bufObject.appendFrame(pts, frame, false, true);
                    
                } else {}
            }
            // //console.log(_this.bufObject.videoBuffer);
            // //console.log(_this.bufObject.audioBuffer);
            window.clearInterval(loop1);
            loop1 = null;
        }, 0);
        return;
    };

/*
    mp4boxfile.onItem = function(item) {
        //console.log(item.data.buffer);
    };

    mp4boxfile.onSegment = function(id, user, buffer, sampleNum, is_last) {
        //console.log("mp4boxfile.onSegment");
        //console.log(
            {id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last}
        );
    };
*/

    // this.mp4boxfile.appendBuffer(dataStream);
    // this.mp4boxfile.flush();
}

/*
 * 优化一下性能问题
 */
Mp4Parser.prototype.appendBufferData = function(dataStream, fileStart=0) {
    // //console.log("appendBufferData==>", fileStart, dataStream);
    dataStream.fileStart = fileStart;
    return this.mp4boxfile.appendBuffer(dataStream);
}

Mp4Parser.prototype.finishBuffer = function() {
    this.mp4boxfile.flush();
}

Mp4Parser.prototype.play = function() {
}

Mp4Parser.prototype.getVideoCoder = function() {
    return this.videoCodec;
}

Mp4Parser.prototype.getDurationMs = function() {
    return this.durationMs;
}

Mp4Parser.prototype.getFPS = function() {
    return this.fps;
}

Mp4Parser.prototype.getSampleRate = function() {
    return this.sampleRate;
}

Mp4Parser.prototype.getSize = function() {
    return this.size;
}

// @TODO
Mp4Parser.prototype.seek = function(pts) {
    if (pts >= 0) {
        // this.seekPos = parseInt(pts);
        // //console.log("to seek:" + this.seekPos);
        // this.mp4boxfile.seek(this.seekPos, true);
        // todo
        let realPos = this.bufObject.seekIDR(pts);
        this.seekPos = realPos;
        //console.log("toSeek realPos: " + realPos);
    }
    // //console.log(this.bufObject.idrIdxBuffer);
    // this.mp4boxfile.start();
}

/*
 * _this.sampleQueue.shift();
 * @Param Int track_id 1Video 2Audio
 */
Mp4Parser.prototype.popBuffer = function(track_id = 1, ptsec = -1) {
    if (ptsec < 0) {
        return null;
    }
    if (track_id == 1) {
        console.log("Mp4Parser.prototype.popBuffer==>", ptsec);
        return this.bufObject.vFrame(ptsec);
    } else if (track_id == 2) {
        return this.bufObject.aFrame(ptsec);
    } else {}
}

Mp4Parser.prototype.addBuffer = function(mp4track) {
    let _this = this;
	let track_id = mp4track.id;
    _this.mp4boxfile.setExtractionOptions(track_id);
}

Mp4Parser.prototype.initializeAllSourceBuffers = function() {
    let _this = this;
	if (_this.movieInfo) {
		let info = _this.movieInfo;
		for (let i = 0; i < info.tracks.length; i++) {
            // //console.log("addBuffer:" + i);
			let track = info.tracks[i];
			_this.addBuffer(track);
		}
		_this.initializeSourceBuffers();
	}
}

Mp4Parser.prototype.onInitAppended = function(e) {
    let _this = this;

	let sb = e.target;
	if (sb.ms.readyState === "open") {
		sb.sampleNum = 0;
		sb.removeEventListener('updateend', _this.onInitAppended);
		// sb.addEventListener('updateend', onUpdateEnd.bind(sb, true, true));
		// onUpdateEnd.call(sb, false, true);
		sb.ms.pendingInits--;
		if (sb.ms.pendingInits === 0) {
            _this.mp4boxfile.start();
		}
	}
}

Mp4Parser.prototype.initializeSourceBuffers = function() {
    let _this    = this;
	let initSegs = _this.mp4boxfile.initializeSegmentation();

	for (let i = 0; i < initSegs.length; i++) {
		let sb = initSegs[i].user;
		if (i === 0) {
			sb.ms.pendingInits = 0;
		}
		sb.addEventListener("updateend", _this.onInitAppended);
		//Log.info("MSE - SourceBuffer #"+sb.id,"Appending initialization data");
		sb.appendBuffer(initSegs[i].buffer);
        // //console.log(initSegs[i].buffer);
		//saveBuffer(initSegs[i].buffer, 'track-'+initSegs[i].id+'-init.mp4');
		sb.segmentIndex = 0;
		sb.ms.pendingInits++;
	}
	//initAllButton.disabled = true;	
	//initButton.disabled = true;
}

module.exports = Mp4Parser
