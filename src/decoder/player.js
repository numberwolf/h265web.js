var YUVBuffer = require('yuv-buffer');
var YUVCanvas = require('yuv-canvas');

const DEFAULT_WIDTH     = 400;
const DEFAULT_HEIGHT    = 400;
const DEFAULT_FPS       = 25;
const DEFAULT_FIXED     = false;

global.InitPlayerImp = function(vconf={}) {
    var playImpObject = new PlayerImp(vconf);
    return playImpObject;
};

// Get your canvas
// global.canvas = document.querySelector('canvas#draw');
// var yuv = YUVCanvas.attach(canvas);

/**<div style="position: fixed; width: 100px; height: 100px;">VideoMissile Player</div>
 * @brief: construct
 */
function PlayerImp(vconf={}) {
    console.log("Player INIT!");
    this.standardizingConf(vconf);

    // Class Object
    this.renderId                           = "glplayer";
    this.fps                                = this.vconf["fps"];

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
    this.videoIsStart                       = true;
}

PlayerImp.prototype.standardizingConf = function(vconf={}) {
    /*
    {
        width   : "600px",
        height  : "400px",
        fps     : 24,
        fixed   : false
    }
    */
    this.vconf = vconf;
    if ("width" in vconf    === false) {
        this.vconf["width"]     = DEFAULT_WIDTH;
    }
    if ("height" in vconf   === false) {
        this.vconf["height"]    = DEFAULT_HEIGHT;
    }
    if ("fps" in vconf      === false) {
        this.vconf["fps"]       = DEFAULT_FPS;
    }
    if ("fixed" in vconf    === false) {
        this.vconf["fixed"]     = DEFAULT_FIXED;
    }
    this.vconf["widthNum"]  = parseInt(this.vconf["width"]);
    this.vconf["heightNum"] = parseInt(this.vconf["height"]);
};

PlayerImp.prototype.drawBuffer = function(buffer) {
    this.yuv.drawFrame(buffer);
};

PlayerImp.prototype.releaseDraw = function() {
    // Or clear the canvas.
    this.yuv.clear();
};

// xhr
PlayerImp.prototype.blobRead = function(url,callback) {
    var _this   = this;
    var xhr     = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onload = function(res) {
        if (xhr.status === 200) {
            var type = xhr.getResponseHeader('Content-Type');
            var blob = new Blob([this.response], {type: type});
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                /*
                 * For IE
                 * >=IE10 
                 */
                // window.navigator.msSaveBlob(blob, fileName);
            } else {
                // /*
                //  * For Non-IE (chrome, firefox) 
                //  */
                // var URL = window.URL || window.webkitURL;
                // var objectUrl = URL.createObjectURL(blob);
                // if (fileName) {
                //     var a = document.createElement('a');
                //     if (typeof a.download === 'undefined') {
                //         window.location = objectUrl;
                //     } else {
                //         a.href = objectUrl;
                //         a.download = fileName;
                //         document.body.appendChild(a);
                //         a.click();
                //         a.remove();
                //     }
                // } else {
                //         window.location = objectUrl;
                // }

                callback(blob);
            }
        }
    };
    xhr.send();
};

/**
 * @return WebGL display Size args[width,height]
 */
PlayerImp.prototype.checkDisplaySize = function(widthIn, heightIn) {
    var cWidth  = this.vconf["widthNum"];
    var cHeight = this.vconf["heightNum"];
    // console.log(widthIn,heightIn,cWidth,cHeight);

    var retW = 0;
    var retH = 0;

    // absolute display size
    if (this.vconf["fixed"] === true) {
        // console.log("fixed");

        retW = cWidth;
        retH = cHeight;

    } else {
        // console.log("not fixed");
        var resizeRatioScale = 1;

        // if (widthIn > cWidth || heightIn > cHeight) { // >
            if (widthIn/cWidth > heightIn/cHeight) {

                resizeRatioScale = (cWidth/widthIn).toFixed(2);
            } else {

                resizeRatioScale = (cHeight/heightIn).toFixed(2);
            }
        // } else { // <
        //     if (widthIn/cWidth > heightIn/cHeight) {
        //         resizeRatioScale = (cWidth/widthIn).toFixed(2);
        //     } else {
        //         resizeRatioScale = (cHeight/heightIn).toFixed(2);
        //     }
        // }
        // else {
        //     if (widthIn > cWidth) {
        //         resizeRatioScale = (cWidth/widthIn).toFixed(2);
        //     } else if(heightIn > cHeight) {
        //         resizeRatioScale = (cHeight/heightIn).toFixed(2);
        //     } else { // smaller

        //     }
        // }
        // console.log("resizeRatioScale:",resizeRatioScale);
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

    return [retW,retH];

    // if (
    //     this.canvasBox.offsetWidth      != widthIn
    //     || this.canvasBox.offsetHeight   != heightIn
    // ) {
    //     this.canvasBox.style.width  = widthIn   + "px";
    //     this.canvasBox.style.height = heightIn  + "px";
    //     this.canvas.style.width     = this.canvasBox.clientWidth    + "px";
    //     this.canvas.style.height    = this.canvasBox.clientHeight   + "px";
    // }
};

PlayerImp.prototype.drawImage = function(width, height, imageBufferY,imageBufferB,imageBufferR) {
    var displayWH = this.checkDisplaySize(width,height);
    // console.log(displayWH);

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
    // var imageData   = this.ctx.createImageData(width, height);
    // var k           = 0;
    // for (var i = 0; i < buffer.length; i++) {
    //     if (i && i % 3 === 0) {
    //         imageData.data[k++] = 255;
    //     }
    //     imageData.data[k++] = buffer[i];
    // }
    // imageData.data[k]       = 255;
    // this.memCanvas.width    = width;
    // this.memCanvas.height   = height;
    // // this.canvas.height      = this.canvas.width * height / width;
    // this.memContext.putImageData(imageData, 0, 0, 0, 0, width, height);
    // this.ctx.drawImage(this.memCanvas, 0, 0, width, height, 0, 0, this.canvas.width, this.canvas.height);
};

PlayerImp.prototype.initFileReader = function() {
    var _this = this;
    _this.fileReader        = new FileReader();
    _this.fileReaderAudio   = new FileReader();
    /*
     * fileReader回调函数
     */
    _this.fileReader.onload = function () {
        try {
            var streamBuf = new Uint8Array(_this.fileReader.result);
            _this.codeImpObj.setStreamRet(streamBuf);

        } catch (e) {
            alert('Crash[brower]! Please refresh your page');
            throw e;
        }

        // console.log("============GO");
        _this.time_loop_tool = window.setInterval(function(){
            _this.playFrame();
        }, 1000/_this.fps); // 1000/24 fps=24

        // release();
        
    }; // end fileReader

    /*
     * fileReader回调函数
     */
    _this.fileReaderAudio.onload = function() {
        try {
            var streamBuf = new Uint8Array(_this.fileReaderAudio.result);
            _this.audiImpObj.addSample(streamBuf);
            // 音频等视频
            while (1) {
                console.log(_this.videoIsStart);
                if (_this.videoIsStart == true) {
                    _this.audiImpObj.play();
                    break;
                }
            }

        } catch (e) {
            alert('Crash[brower]! Please refresh your page');
            throw e;
        }
        
    }; // end fileReader
};

PlayerImp.prototype.initPlayer = function(callback) {
    var _this = this;

    // func
    _this.time_loop_tool      = null;
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

    /*
     * 初始化
     */
    Module.onRuntimeInitialized = function () {
        _this.initMissile           = Module.cwrap('initMissile', 'number', []);
        _this.initializeDecoder     = Module.cwrap('initializeDecoder', 'number', []);
        _this.decodeCodecContext    = Module.cwrap('decodeCodecContext', 'number', ['number', 'number']);
        _this.getFrame              = Module.cwrap('getFrame', 'number', []);
        _this.release               = Module.cwrap('release', 'number', []);

        // setFile     = Module.cwrap('setFile', 'number', ['number', 'number', 'number']);
        // setFileUrl  = Module.cwrap('setFileUrl', 'number', ['string']);
        // getFrame    = Module.cwrap('getFrame', 'number', []);
        // release     = Module.cwrap('release', 'number', ['number']);

        _this.codeImpObj            = new CodecImp();
        _this.audiImpObj            = new AudioImp();
        _this.audiImpObj.init();

        var initMisRet = _this.initMissile();
        console.log('WASM initialized done!' + initMisRet);
        _this.initFileReader();

        callback();
    };

    return true;
};

// PlayerImp.prototype.initMemCanvas = function(dom_selector) {
//     // 内存画布
//     this.memCanvas      = document.createElement('canvas');
//     this.memContext     = this.memCanvas.getContext('2d');
//     this.canvas         = document.querySelector(dom_selector);
//     this.ctx            = this.canvas.getContext('2d');
//     this.canvas.width   = Math.max(600, window.innerWidth - 40);
// };

PlayerImp.prototype.playFrame = function() {
    this.videoIsStart = true;
    var nalBuf = this.codeImpObj.nextNalu(); // nal

    if (nalBuf != false) {
        var offset = Module._malloc(nalBuf.length);
        Module.HEAP8.set(nalBuf, offset);

        var decRet = this.decodeCodecContext(offset,nalBuf.length);
        // console.log("decRet:" + decRet);

        if (decRet >= 0 ) {
            let ptr             = this.getFrame();
            var parse_dict      = this.codeImpObj.parseFrameStruct(ptr);

            if (!parse_dict["width"] || !parse_dict["height"]) {
                console.log('Get PicFrame failed! PicWidth/height is equal to 0, maybe timeout!');
                // continue;
            } else {
                // console.log("start drawImage");
                // this.drawImage(width, height, imageBuffer);
                this.drawImage(parse_dict["width"], parse_dict["height"], parse_dict["imageBufferY"], parse_dict["imageBufferB"], parse_dict["imageBufferR"]);
                // console.log(imageBuffer);
                // const blob = new Blob([imageBuffer.buffer]);
                // const url = URL.createObjectURL(blob);
                // document.getElementById('link').href = url
            }
        } //  end if decRet
        Module._free(offset);
    }

};

PlayerImp.prototype.closeTimeLoop = function() {
    window.clearInterval(this.time_loop_tool);
    this.videoIsStart = true;
    this.time_loop_tool = null;
};

PlayerImp.prototype.reStartPlay = function(play_url="", fps=24) {
    var _this   = this;
    _this.closeTimeLoop();

    _this.fps           = fps;
    var relRet          = _this.release();
    _this.videoIsStart  = false;

    _this.initializeDecoder();
    this.blobRead(play_url,function(blob) {
        _this.fileReader.readAsArrayBuffer(blob);
    });
};

PlayerImp.prototype.reStartPlayAudio = function(play_url="") {
    var _this   = this;
    _this.closeTimeLoop();

    // var relRet  = _this.release();
    // _this.initializeDecoder();

    this.blobRead(play_url,function(blob) {
        _this.fileReaderAudio.readAsArrayBuffer(blob);
    });
};

PlayerImp.prototype.continueStart = function() {
    var _this = this;
    if (_this.time_loop_tool != null) {
        console.log("already playing!!!fucking stop ur action!");
        return;
    }

    _this.time_loop_tool = window.setInterval(function(){
        _this.playFrame();
    }, 1000/_this.fps); // 1000/24 fps=24
};

PlayerImp.prototype.endAudio = function() {
    this.audiImpObj.stop();
    this.audiImpObj.init(this.initAudioOptions);
};

PlayerImp.prototype.reInitDecoder = function() {
    var _this   = this;
    var relRet  = _this.release();
    _this.initializeDecoder();
};

PlayerImp.prototype.stop = function() {
    this.closeTimeLoop();
    this.endAudio();
    this.reInitDecoder();
    this.codeImpObj.clearStreamRet();
    this.codeImpObj.clearFrameRet();
};
