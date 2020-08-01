const MP4Box = require('mp4box')
const STARTCODE = new Uint8Array([0, 0, 0, 1])
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
}

function Mp4Parser() {
    // Class Object
}

/*
 * Add start code 0x00 0x00 0x00 0x01
 */
Mp4Parser.prototype.setStartCode = function(dataStream, replace=false) {
    var returnStream = null;
    if (replace) {
        returnStream = dataStream;
        returnStream[0] = STARTCODE[0];
        returnStream[1] = STARTCODE[1];
        returnStream[2] = STARTCODE[2];
        returnStream[3] = STARTCODE[3];
    } else {
        returnStream = new Uint8Array(STARTCODE.length + dataStream.length);
        returnStream.set(STARTCODE, 0);
        returnStream.set(dataStream, STARTCODE.length);
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
    var returnStream    = null;
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
    var profile         = this.aacProfile;
    // var freqIdx         = 4; // 4:44.1KHz  8:16KHz
    var freqIdx         = SAMPLEINDEX[this.sampleRate];
    var chanCfg         = 2; // CPE  
    // console.log(profile, freqIdx);

    /*
   ff       f1         50     40       01       7f       fc       --> 01182007
11111111 11110001 01010000 0100 0000 00000001 01111111 11111100
                               |
|------------- 28bits----------|-----------------28 bits-------|
                                 |00 00000001 011| = pkt length = 1011 = 11 (bytes)
                                 --------------------------------------------------
                                 |     ff f1 50 40 01 7f fc 01 18 20 07 <- 11 bytes
    */
    var adtsHead        = new Uint8Array(7);
    var packetLen       = adtsHead.length + dataStream.length;
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

Mp4Parser.prototype.demux = function(dataStream) {
    var _this = this;
    dataStream.fileStart= 0;

    _this.seekPos       = -1;
    _this.mp4boxfile    = MP4Box.createFile();
    _this.movieInfo     = null;

    _this.durationMs    = -1.0;
    _this.fps           = -1;
    _this.sampleRate    = -1;
    _this.aacProfile    = 2; // LC
    _this.size          = {
        width   : -1,
        height  : -1
    };

    /*
     * item : {pts: 0, frame: Uint8Array}
     */
    _this.trackVideos   = [];
    _this.trackAudios   = [];

    //var mp4boxfile = MP4Box.createFile();
    _this.mp4boxfile.onError = function(e) {
        console.log(e);
    };

    _this.mp4boxfile.onSamples = function (id, user, samples) {
        // console.log("global.VIDEO_TEST_SEEK" + global.VIDEO_TEST_SEEK);
        // if (global.VIDEO_TEST_SEEK == true) {
        //     _this.mp4boxfile.seek(200, true);
        //     global.VIDEO_TEST_SEEK = false;
        // }
        
        // console.log(
        //     "Received " + samples.length 
        //     + " samples on track "+ id 
        //     + (user ? " for object " + user: "")
        // );

        /*
         * track_id 1video 2audio
         */
        for (var i = 0; i < samples.length; i++) {
            var sample  = samples[i];
            var data    = sample.data;
            var frame   = null;
            if (data == null || data.length < 4 || !data) {
                continue;
            }

            // var pts = (samples[i].dts + samples[i].cts) / _this.movieInfo.timescale;
            // var pts = samples[i].dts + samples[i].cts;
            // console.log("pts:" + pts);

            var pts = (samples[i].dts) / samples[i].timescale;

            // Seek Opera
            // if (_this.seekPos > 0) {
            //     if (pts < (_this.seekPos - _this.seekDiffTime)) {
            //         continue;
            //     }
            // }
            console.log("id:" + id + ", pts:" + pts);

            if (id == 1) {
                /*
                 * 针对265的NALU填充
                 */
                var hvcC    = sample.description.hvcC;
                
                if (i == 0) {
                    var naluArr = hvcC.nalu_arrays;
                    // var data    = hvcC.data;
                    // console.log(naluArr);
                    // 64, 1, 12, 1, 255, 255, 1, 96, 0, 0, 3, 0, 144, 0, 0, 3, 0, 0, 3, 0, 63, 149, 152, 9
                    // 0, 0, 0, 1, 64, 1, 12, 78, 1, 5, 255, 255, 255,
                    var naluVPS = _this.setStartCode(naluArr[0][0].data, false);
                    var naluSPS = _this.setStartCode(naluArr[1][0].data, false);
                    var naluPPS = _this.setStartCode(naluArr[2][0].data, false);
                    var naluSEI = _this.setStartCode(naluArr[3][0].data, false);

                    // var naluLen = naluVPS.length + naluSPS.length + naluPPS.length + naluSEI.length;
                    // console.log("naluLen:" + naluLen + ", framelen:" + (naluLen+data.length));

                    frame = new Uint8Array(
                        naluVPS.length + naluSPS.length + naluPPS.length + naluSEI.length + data.length
                    );
                    frame.set(naluVPS, 0);
                    frame.set(naluSPS, naluVPS.length);
                    frame.set(naluPPS, naluVPS.length + naluSPS.length);
                    frame.set(naluSEI, naluVPS.length + naluSPS.length + naluPPS.length);
                    frame.set(_this.setStartCode(data, true), naluVPS.length + naluSPS.length + naluPPS.length + naluSEI.length);
                } else {
                    frame = _this.setStartCode(data, true);
                }

                _this.trackVideos.push({
                    pts  : pts,
                    data : frame
                });
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
                _this.trackAudios.push({
                    pts  : pts,
                    data : frame
                });
                // console.log(frame);
            }
        }
        
        // console.log(samples);
    };

/*
    mp4boxfile.onItem = function(item) {
        console.log(item.data.buffer);
    };

    mp4boxfile.onSegment = function(id, user, buffer, sampleNum, is_last) {
        console.log("mp4boxfile.onSegment");
        console.log(
            {id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last}
        );
    };
*/

    this.mp4boxfile.onReady = function(info) {
        console.log(info);
        _this.movieInfo = info;
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
        // console.log("start calcute");
        var tmpDurationSec = -1.0;
        if (1 == 0) { // info.duration > 0
            tmpDurationSec = (info.duration / info.timescale);
        } else {
            // tmpDurationSec = 1000 * (info.tracks[0].samples_duration / info.tracks[0].timescale);
            tmpDurationSec = (info.videoTracks[0].samples_duration / info.videoTracks[0].timescale);
            // console.log(info.videoTracks[0].samples_duration);
            // console.log(info.videoTracks[0].timescale);
        }

        // console.log(tmpDurationSec, 1000 * tmpDurationSec);
        // console.log(info.videoTracks[0].nb_samples, info.videoTracks[0].nb_samples / tmpDurationSec);
        
        _this.durationMs        = 1000 * tmpDurationSec;
        _this.fps               = info.videoTracks[0].nb_samples / tmpDurationSec;
        // console.log(_this.durationMs, _this.fps);
        _this.seekDiffTime      = 1 / _this.fps;

        _this.sampleRate        = info.audioTracks[0].audio.sample_rate;
        // codec: 'mp4a.40.5'  profile=5 HE-AAC
        var audioCodecDesc      = info.audioTracks[0].codec.split(".");
        _this.aacProfile        = audioCodecDesc[audioCodecDesc.length-1];
        _this.size["width"]     = info.videoTracks[0].track_width;
        _this.size["height"]    = info.videoTracks[0].track_height;
        
        _this.initializeAllSourceBuffers();
        // _this.mp4boxfile.start();
    };

    this.mp4boxfile.appendBuffer(dataStream);
    this.mp4boxfile.flush();
}

Mp4Parser.prototype.play = function() {
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

Mp4Parser.prototype.seek = function(second) {
    if (second > 0) {
        this.seekPos = parseInt(second);
        console.log("to seek:" + this.seekPos);
        this.mp4boxfile.seek(this.seekPos, true);
    }
    this.mp4boxfile.start();
}

/*
 * _this.sampleQueue.shift();
 * @Param Int track_id 1Video 2Audio
 */
Mp4Parser.prototype.popBuffer = function(track_id = 1) {
    var _this       = this;
    var data        = null;
    var firstPTS    = -1;

    if (track_id == 1 && _this.trackVideos.length > 0) {
        var track = _this.trackVideos.shift();
        if (firstPTS < 0) {
            firstPTS = track["pts"];
        }
        data = track["data"];

    } else if (track_id == 2 && _this.trackAudios.length > 0) {
        // 一次十帧  0.02s * 10
        var audioOnceLimit = 2;
        // var audioOnceLimit = _this.trackAudios.length;
        
        while (_this.trackAudios.length > 0 && audioOnceLimit >= 0) {
            var track = _this.trackAudios.shift();
            // console.log(track);

            if (firstPTS < 0) {
                firstPTS = track["pts"];
            }

            var item = track["data"];
            if (data == null) {
                data = item;
            } else {
                var tmp = new Uint8Array(data.length + item.length);
                tmp.set(data, 0);
                tmp.set(item, data.length);

                data = tmp;
            }
            audioOnceLimit--;
        }
        
    }

    if (data == null) {
        return null;
    }
    return {
        pts  : firstPTS,
        data : data
    }
}

Mp4Parser.prototype.addBuffer = function(mp4track) {
    var _this = this;
	var track_id = mp4track.id;
    _this.mp4boxfile.setExtractionOptions(track_id);
}

Mp4Parser.prototype.initializeAllSourceBuffers = function() {
    var _this = this;
	if (_this.movieInfo) {
		var info = _this.movieInfo;
		for (var i = 0; i < info.tracks.length; i++) {
            // console.log("addBuffer:" + i);
			var track = info.tracks[i];
			_this.addBuffer(track);
		}
		_this.initializeSourceBuffers();
	}
}

Mp4Parser.prototype.onInitAppended = function(e) {
    var _this = this;

	var sb = e.target;
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
    var _this    = this;
	var initSegs = _this.mp4boxfile.initializeSegmentation();

	for (var i = 0; i < initSegs.length; i++) {
		var sb = initSegs[i].user;
		if (i === 0) {
			sb.ms.pendingInits = 0;
		}
		sb.addEventListener("updateend", _this.onInitAppended);
		//Log.info("MSE - SourceBuffer #"+sb.id,"Appending initialization data");
		sb.appendBuffer(initSegs[i].buffer);
        // console.log(initSegs[i].buffer);
		//saveBuffer(initSegs[i].buffer, 'track-'+initSegs[i].id+'-init.mp4');
		sb.segmentIndex = 0;
		sb.ms.pendingInits++;
	}
	//initAllButton.disabled = true;	
	//initButton.disabled = true;
}

module.exports = Mp4Parser
