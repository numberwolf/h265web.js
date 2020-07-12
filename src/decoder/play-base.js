var YUVBuffer = require('yuv-buffer');
var YUVCanvas = require('yuv-canvas');

// global.InitPlayBase = function(vconf={}) {
//     var liveImpObject = new PlayBase(vconf);
//     return liveImpObject;
// };

global.Init = function(callback) {
    var liveImpObject = new PlayBase(callback);
    return liveImpObject;
};

// Get your canvas
// global.canvas = document.querySelector('canvas#draw');
// var yuv = YUVCanvas.attach(canvas);

/**<div style="position: fixed; width: 100px; height: 100px;">VideoMissile Player</div>
 * @brief: construct
 */
// function PlayBase(vconf={}) {
//     console.log("Player INIT!");
//     this.standardizingConf(vconf);


//     // Class Object
//     this.renderId                           = "glplayer";
//     // this.ws 								= null;
//     this.fps                                = this.vconf["fps"];
//     this.sampleRate                         = this.vconf["sampleRate"];
//     this.initAudioOptions                   = {
//         sampleRate : this.sampleRate
//     };
//     this.time_loop_tool                     = null;
//     // media durationMs. default -1(live)
//     this.media_runtime                      = {
//         durationMs  : -1.0,
//         playTime    : 0.0
//     };

//     this.canvasBox                          = document.querySelector('div#' + this.renderId);
//     this.canvasBox.style.backgroundColor    = "black";
//     this.canvasBox.style.width              = this.vconf["width"];
//     this.canvasBox.style.height             = this.vconf["height"];

//     eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('n.o  = f.d(\'e\');    n.o.m.k = "8";    n.o.j = \'<a>\'    + \'<h c="#g" l="2">\'    + "7 4 6 5"    + "</h>"    + "</a>";    n.o.m.p = "1";    n.o.m.i = "3";    n.o.m.q = "0";    n.b.9(n.o);',62,27,'101|230px|3|40px|Missile|Support|Tech|Video|absolute|appendChild|b|canvasBox|color|createElement|div|document|e9e9e9|font|height|innerHTML|position|size|style|this|waterMark|width|zIndex'.split('|'),0,{}));

//     this.canvas                             = document.createElement('canvas');
//     this.canvas.id                          = this.renderId;
//     this.canvas.style.width                 = this.canvasBox.clientWidth + "px";
//     this.canvas.style.height                = this.canvasBox.clientHeight + "px";
//     this.canvas.style.top                   = "0px";
//     this.canvas.style.left                  = "0px";
//     this.canvasBox.appendChild(this.canvas);

//     this.yuv                                = YUVCanvas.attach(this.canvas);
// }

function PlayBase(callback) {
    this.initPlayer(callback);
}

PlayBase.prototype.settingPlayer = function(setting_conf = {}) {
    console.log("settingPlayer");
    console.log(setting_conf);
    if ("fps" in setting_conf) {
        this.vconf["fps"] = setting_conf["fps"];
    }
    if ("sampleRate" in setting_conf) {
        this.vconf["sampleRate"] = setting_conf["sampleRate"];
    }
    this.fps        =  this.vconf["fps"];
    this.sampleRate = setting_conf["sampleRate"];

};

PlayBase.prototype.createPlayer = function(vconf = {}, callback = null) {
    // console.log("Player Create!");
    this.standardizingConf(vconf);


    // Class Object
    this.renderId                           = "glplayer";
    // this.ws                               = null;
    this.fps                                = this.vconf["fps"];
    this.sampleRate                         = this.vconf["sampleRate"];
    this.initAudioOptions                   = {
        sampleRate  : this.sampleRate,
        appendType  : this.vconf["appendHevcType"]
    };
    this.audiImpObj.init(this.initAudioOptions);
    this.time_loop_tool                     = null;
    // media durationMs. default -1(live)
    this.media_runtime                      = {
        durationMs  : -1.0
        // playTime    : 0.0
    };

    this.canvasBox                          = document.querySelector('div#' + this.renderId);
    this.canvasBox.style.backgroundColor    = "black";
    this.canvasBox.style.width              = this.vconf["width"];
    this.canvasBox.style.height             = this.vconf["height"];

    eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('n.o  = f.d(\'e\');    n.o.m.k = "8";    n.o.j = \'<a>\'    + \'<h c="#g" l="2">\'    + "7 4 6 5"    + "</h>"    + "</a>";    n.o.m.p = "1";    n.o.m.i = "3";    n.o.m.q = "0";    n.b.9(n.o);',62,27,'101|230px|3|40px|Missile|Support|Tech|Video|absolute|appendChild|b|canvasBox|color|createElement|div|document|e9e9e9|font|height|innerHTML|position|size|style|this|waterMark|width|zIndex'.split('|'),0,{}));

    this.canvas                             = document.createElement('canvas');
    this.canvas.id                          = this.renderId;
    this.canvas.style.width                 = this.canvasBox.clientWidth + "px";
    this.canvas.style.height                = this.canvasBox.clientHeight + "px";
    this.canvas.style.top                   = "0px";
    this.canvas.style.left                  = "0px";
    this.canvasBox.appendChild(this.canvas);

    this.yuv                                = YUVCanvas.attach(this.canvas);

    if (callback) {
        callback();
    }

    return true;
};

PlayBase.prototype.standardizingConf = function(vconf={}) {
    /*
    {
        width   : "600px",
        height  : "400px",
        fps     : 24,
        fixed   : false
    }
    */
    this.vconf = vconf;
    if ("width" in vconf === false) {
        this.vconf["width"]     = DEFAULT_WIDTH;
    }
    if ("height" in vconf === false) {
        this.vconf["height"]    = DEFAULT_HEIGHT;
    }
    if ("fps" in vconf === false) {
        this.vconf["fps"]       = DEFAULT_FPS;
    }
    if ("fixed" in vconf === false) {
        this.vconf["fixed"]     = DEFAULT_FIXED;
    }
    if ("sampleRate" in vconf === false) {
        this.vconf["sampleRate"] = DEFAULT_SAMPLERATE;
    }
    if ("appendHevcType" in vconf === false) {
        this.vconf["appendHevcType"] = APPEND_TYPE_STREAM;
    }
    this.vconf["widthNum"]  = parseInt(this.vconf["width"]);
    this.vconf["heightNum"] = parseInt(this.vconf["height"]);
    // this.vconf["frameDur"]  = 1000 / this.vconf["fps"];
    // console.log('this.vconf["frameDur"] : ' + this.vconf["frameDur"]);
};

PlayBase.prototype.setDurationMs = function(durationMs = -1) {
    this.media_runtime["durationMs"] = durationMs;
    this.audiImpObj.setDurationMs(durationMs);
};

/**
 * @param Uint8Array
 * @param appendType 0x00 stream 0x01 frame
 */
PlayBase.prototype.appendHevcFrame = function(streamBytes) {
    if (this.vconf["appendHevcType"] == APPEND_TYPE_STREAM) {
        return this.codeImpObj.pushStreamRet(streamBytes);
    } else if (this.vconf["appendHevcType"] == APPEND_TYPE_FRAME) {
        return this.codeImpObj.pushFrameRet(streamBytes);
    }

}

/**
 * @param Uint8Array
 */
PlayBase.prototype.appendAACFrame = function(streamBytes) {
    // console.log(streamBytes);
    var ret = this.audiImpObj.addSample(streamBytes);
    return ret;
}

PlayBase.prototype.endAudio = function() {
    this.audiImpObj.stop();
	this.audiImpObj.init(this.initAudioOptions);
};

PlayBase.prototype.drawBuffer = function(buffer) {
    this.yuv.drawFrame(buffer);
};

PlayBase.prototype.releaseDraw = function() {
    // Or clear the canvas.
    this.yuv.clear();
};

/**
 * @return WebGL display Size args[width,height]
 */
PlayBase.prototype.checkDisplaySize = function(widthIn, heightIn) {
    var cWidth  = this.vconf["widthNum"];
    var cHeight = this.vconf["heightNum"];
    // console.log(widthIn,heightIn,cWidth,cHeight);

    var retW = 0;
    var retH = 0;

    // absolute display size
    if (this.vconf["fixed"] === true) {

        retW = cWidth;
        retH = cHeight;

    } else {
        var resizeRatioScale = 1;

        if (widthIn/cWidth > heightIn/cHeight) {
            resizeRatioScale = (cWidth/widthIn).toFixed(2);
        } else {
            resizeRatioScale = (cHeight/heightIn).toFixed(2);
        }

        retW = parseInt(widthIn  * resizeRatioScale);
        retH = parseInt(heightIn * resizeRatioScale);
    }

    if (this.canvas.offsetWidth != retW || this.canvas.offsetHeight != retH) {
        var topMargin   = parseInt((this.canvasBox.offsetHeight - retH) / 2);
        var leftMargin  = parseInt((this.canvasBox.offsetWidth - retW) / 2);

        this.canvas.style.marginTop     = topMargin     + "px";;
        this.canvas.style.marginLeft    = leftMargin    + "px";;
        this.canvas.style.width         = retW  + "px";
        this.canvas.style.height        = retH  + "px";
    }

    return [retW, retH];
};

PlayBase.prototype.drawImage = function(width, height, imageBufferY,imageBufferB,imageBufferR) {
    var displayWH = this.checkDisplaySize(width,height);

    var format = YUVBuffer.format({
        width:          width,
        height:         height,
        chromaWidth:    width/2,
        chromaHeight:   height/2,
        displayWidth:   this.canvas.offsetWidth,
        displayHeight:  this.canvas.offsetHeight
    });
    var frame = YUVBuffer.frame(format);

    // console.log("[debug]");
    frame.y.bytes = imageBufferY;
    frame.y.stride = width;
    // console.log(imageBufferY);

    frame.u.bytes = imageBufferB;
    frame.u.stride = width/2;

    frame.v.bytes = imageBufferR;
    frame.v.stride = width/2;

    this.drawBuffer(frame);

};

PlayBase.prototype.initPlayer = function(callback) {
    var _this = this;

    // func
    // _this.time_loop_tool      = null;
    _this.initMissile         = null;
    _this.initializeDecoder   = null;
    _this.decodeCodecContext  = null;
    _this.getFrame            = null;
    _this.release             = null;
    // imp
    _this.codeImpObj          = null;
    _this.audiImpObj          = null;

    if (!window.WebAssembly) {
        let tip = 'unsupport WASM!';
        if (/iPhone|iPad/.test(window.navigator.userAgent)) {
            tip += ' ios:min-version 11'
        }
        alert(tip);
        alert("此设备不支持此应用! 请使用支持WASM和WEBGL的设备！");
        return false;
    }

    // console.log(Module);

    /*
     * 初始化
     * 通过onRuntimeInitialized事件可以知道wasm文件已经被加载完了。接下来就可以调用C的接口
     */
    Module.onRuntimeInitialized = function () {
        // console.log("start init");
        _this.initMissile         = Module.cwrap('initMissile', 'number', []);
        _this.initializeDecoder   = Module.cwrap('initializeDecoder', 'number', []);
        _this.decodeCodecContext  = Module.cwrap('decodeCodecContext', 'number', ['number', 'number']);
        _this.getFrame            = Module.cwrap('getFrame', 'number', []);
        _this.release             = Module.cwrap('release', 'number', []);

        // setFile     = Module.cwrap('setFile', 'number', ['number', 'number', 'number']);
        // setFileUrl  = Module.cwrap('setFileUrl', 'number', ['string']);
        // getFrame    = Module.cwrap('getFrame', 'number', []);
        // release     = Module.cwrap('release', 'number', ['number']);

        _this.codeImpObj = new CodecImp();
        _this.audiImpObj = new AudioImp();

        var initMisRet = _this.initMissile();
        // console.log('WASM initialized done!' + initMisRet);
        _this.initializeDecoder();

        if (callback) {
            callback();
        }
    };

    // console.log("start init");
    // _this.initMissile         = Module.cwrap('initMissile', 'number', []);
    // _this.initializeDecoder   = Module.cwrap('initializeDecoder', 'number', []);
    // _this.decodeCodecContext  = Module.cwrap('decodeCodecContext', 'number', ['number', 'number']);
    // _this.getFrame            = Module.cwrap('getFrame', 'number', []);
    // _this.release             = Module.cwrap('release', 'number', []);

    // // setFile     = Module.cwrap('setFile', 'number', ['number', 'number', 'number']);
    // // setFileUrl  = Module.cwrap('setFileUrl', 'number', ['string']);
    // // getFrame    = Module.cwrap('getFrame', 'number', []);
    // // release     = Module.cwrap('release', 'number', ['number']);

    // _this.codeImpObj = new CodecImp();
    // _this.audiImpObj = new AudioImp();
    // _this.audiImpObj.init(_this.initAudioOptions);

    // var initMisRet = _this.initMissile();
    // console.log('WASM initialized done!' + initMisRet);
    // _this.initializeDecoder();

    // callback();
    // console.log("initPlayer end");
    return true;
};

// PlayBase.prototype.initMemCanvas = function(dom_selector) {
//     // 内存画布
//     this.memCanvas      = document.createElement('canvas');
//     this.memContext     = this.memCanvas.getContext('2d');
//     this.canvas         = document.querySelector(dom_selector);
//     this.ctx            = this.canvas.getContext('2d');
//     this.canvas.width   = Math.max(600, window.innerWidth - 40);
// };

PlayBase.prototype.playFrame = function() {
    var nalBuf  = null;
    // var pts     = -1;
    if (this.vconf["appendHevcType"] == APPEND_TYPE_STREAM) {
        nalBuf = this.codeImpObj.nextNalu(); // nal
    } else if (this.vconf["appendHevcType"] == APPEND_TYPE_FRAME) {
        var item                = this.codeImpObj.nextFrame(); // nal
        if (!item || item == null) {
            return false;
        }
        console.log(item);
        nalBuf                  = item["data"];
        global.VIDEO_PTS_VAL    = item["pts"];
    } else {
        return false;
    }

    console.log("global.VIDEO_PTS_VAL " + global.VIDEO_PTS_VAL);

    // console.log(nalBuf);

    if (nalBuf != false) {
        var offset = Module._malloc(nalBuf.length);
        Module.HEAP8.set(nalBuf, offset);

        var decRet = this.decodeCodecContext(offset, nalBuf.length);
        // console.log("decRet:" + decRet);

        if (decRet >= 0) {
            var ptr             = this.getFrame();
            var parse_dict      = this.codeImpObj.parseFrameStruct(ptr);

            if (!parse_dict["width"] || !parse_dict["height"]) {
                console.log('Get PicFrame failed! PicWidth/height is equal to 0, maybe timeout!');
            } else {                
                this.drawImage(parse_dict["width"], parse_dict["height"], parse_dict["imageBufferY"], parse_dict["imageBufferB"], parse_dict["imageBufferR"]);
            }
        } //  end if decRet
        Module._free(offset);
    }
};

PlayBase.prototype.reInitDecoder = function() {
    var _this   = this;
    var relRet  = _this.release();
    _this.initializeDecoder();
};

PlayBase.prototype.closeTimeLoop = function() {
    if (this.time_loop_tool != null) {
        window.clearInterval(this.time_loop_tool);
    }
    // this.videoIsStart = true;
    this.time_loop_tool = null;
};

PlayBase.prototype.play = function(callback) {
    var _this               = this;
    var frame_dur           = 1000 / this.fps;
    console.log("fps: " + this.fps);

    _this.time_loop_tool    = window.setInterval(function() {
        // if (_this.media_runtime["durationMs"] > 0 && _this.media_runtime["playTime"] > _this.media_runtime["durationMs"]) {
        if (_this.media_runtime["durationMs"] > 0 && global.VIDEO_PTS_VAL * 1000 >= _this.media_runtime["durationMs"]) {
            _this.stop();
        }
        // _this.media_runtime["playTime"] += _this.vconf["frameDur"];

        _this.playFrame();

        if (callback) {
            callback();
        }
    }, frame_dur); // 1000/24 fps=24 (1000ms / 24frame) * 1sec

    // console.log("to start Play");
    _this.audiImpObj.play();
};

PlayBase.prototype.continues = function() {
    this.play();
};

PlayBase.prototype.pause = function() {
    this.closeTimeLoop();
    this.audiImpObj.pause();
};

PlayBase.prototype.cleanSample = function() {
    this.audiImpObj.cleanQueue();
};

PlayBase.prototype.stop = function() {
    // console.log("to stop");
    this.closeTimeLoop();
    this.endAudio();
    this.reInitDecoder();
    this.codeImpObj.clearStreamRet();
    this.codeImpObj.clearFrameRet();
    // this.media_runtime["playTime"]     = 0.0;
    this.media_runtime["durationMs"]   = -1.0;
    global.VIDEO_PTS_VAL = -1;
};
