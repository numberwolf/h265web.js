(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

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

/**
 * codecImp Obj
 * Video Raw 265 264 Parser
 */
var AfterGetNalThenMvLen = 3;

var RawParserModule =
/*#__PURE__*/
function () {
  function RawParserModule() {
    _classCallCheck(this, RawParserModule);

    this.frameList = [];
    this.stream = null;
  }
  /*
   *****************************************************
   *                                                   *
   *                                                   *
   *                     HEVC Frames                   *
   *                                                   *
   *                                                   *
   *****************************************************
   */


  _createClass(RawParserModule, [{
    key: "pushFrameRet",
    value: function pushFrameRet(streamPushInput) {
      if (!streamPushInput || streamPushInput == undefined || streamPushInput == null) {
        return false;
      }

      if (!this.frameList || this.frameList == undefined || this.frameList == null) {
        this.frameList = [];
        this.frameList.push(streamPushInput);
      } else {
        this.frameList.push(streamPushInput);
      }

      return true;
    }
  }, {
    key: "nextFrame",
    value: function nextFrame() {
      if (!this.frameList && this.frameList == undefined || this.frameList == null && this.frameList.length < 1) {
        return null;
      }

      return this.frameList.shift();
    }
  }, {
    key: "clearFrameRet",
    value: function clearFrameRet() {
      this.frameList = null;
    }
    /*
     *****************************************************
     *                                                   *
     *                                                   *
     *                     HEVC stream                   *
     *                                                   *
     *                                                   *
     *****************************************************
     */

  }, {
    key: "setStreamRet",
    value: function setStreamRet(streamBufInput) {
      this.stream = streamBufInput;
    }
  }, {
    key: "getStreamRet",
    value: function getStreamRet() {
      return this.stream;
    }
    /**
     * push stream nalu, for live, not vod
     * @param Uint8Array
     * @return bool
     */

  }, {
    key: "appendStreamRet",
    value: function appendStreamRet(input) {
      if (!input || input === undefined || input == null) {
        return false;
      }

      if (!this.stream || this.stream === undefined || this.stream == null) {
        this.stream = input;
        return true;
      }

      var lenOld = this.stream.length;
      var lenPush = input.length;
      var mergeStream = new Uint8Array(lenOld + lenPush);
      mergeStream.set(this.stream, 0);
      mergeStream.set(input, lenOld);
      this.stream = mergeStream; // let retList = this.nextNaluList(9000);
      // if (retList !== false && retList.length > 0) {
      //     this.frameList.push(...retList);
      // }

      for (var i = 0; i < 9999; i++) {
        var nalBuf = this.nextNalu();

        if (nalBuf !== false && nalBuf !== null && nalBuf !== undefined) {
          this.frameList.push(nalBuf);
        } else {
          break;
        }
      }

      return true;
    }
    /**
     * sub nalu stream, and get Nalu unit
     */

  }, {
    key: "subBuf",
    value: function subBuf(startOpen, endOpen) {
      // sub block [m,n]
      // nal
      var returnBuf = new Uint8Array(this.stream.subarray(startOpen, endOpen + 1)); // streamBuf sub

      this.stream = new Uint8Array(this.stream.subarray(endOpen + 1));
      return returnBuf;
    }
    /**
     * @param onceGetNalCount: once use get nal count, defult 1
     * @return uint8array OR false
     */

  }, {
    key: "nextNalu",
    value: function nextNalu() {
      var onceGetNalCount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      // check params
      if (this.stream == null || this.stream.length <= 4) {
        return false;
      } // start nal pos


      var startTag = -1; // return nalBuf

      var returnNalBuf = null;

      for (var i = 0; i < this.stream.length; i++) {
        if (i + 5 >= this.stream.length) {
          return false; // if (startTag == -1) {
          //     return false;
          // } else {
          //     // 如果结尾不到判断的字节位置 就直接全量输出最后一个nal
          //     returnNalBuf = this.subBuf(startTag, this.stream.length-1);
          //     return returnNalBuf;
          // }
        } // find nal


        if ( // 0x00 00 01
        this.stream[i] == 0 && this.stream[i + 1] == 0 && this.stream[i + 2] == 1 || // 0x00 00 00 01
        this.stream[i] == 0 && this.stream[i + 1] == 0 && this.stream[i + 2] == 0 && this.stream[i + 3] == 1) {
          // console.log(
          //     "enter find nal , now startTag:" + startTag 
          //     + ", now pos:" + i
          // );
          var nowPos = i;
          i += AfterGetNalThenMvLen; // 移出去
          // begin pos

          if (startTag == -1) {
            startTag = nowPos;
          } else {
            if (onceGetNalCount <= 1) {
              // startCode - End
              // [startTag,nowPos)
              // console.log("[===>] last code hex is :" + this.stream[nowPos-1].toString(16))
              returnNalBuf = this.subBuf(startTag, nowPos - 1);
              return returnNalBuf;
            } else {
              onceGetNalCount -= 1;
            }
          }
        }
      } // end for


      return false;
    }
  }, {
    key: "nextNalu2",
    value: function nextNalu2() {
      var onceGetNalCount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      // check params
      if (this.stream == null || this.stream.length <= 4) {
        return false;
      } // start nal pos


      var startTag = -1; // return nalBuf

      var returnNalBuf = null;

      for (var i = 0; i < this.stream.length; i++) {
        if (i + 5 >= this.stream.length) {
          if (startTag == -1) {
            return false;
          } else {
            // 如果结尾不到判断的字节位置 就直接全量输出最后一个nal
            returnNalBuf = this.subBuf(startTag, this.stream.length - 1);
            return returnNalBuf;
          }
        } // find nal


        var is3BitHeader = this.stream.slice(i, i + 3).join(' ') == '0 0 1';
        var is4BitHeader = this.stream.slice(i, i + 4).join(' ') == '0 0 0 1';

        if (is3BitHeader || is4BitHeader) {
          var nowPos = i;
          i += AfterGetNalThenMvLen; // 移出去
          // begin pos

          if (startTag == -1) {
            startTag = nowPos;
          } else {
            if (onceGetNalCount <= 1) {
              // startCode - End
              // [startTag,nowPos)
              // console.log("[===>] last code hex is :" + this.stream[nowPos-1].toString(16))
              returnNalBuf = this.subBuf(startTag, nowPos - 1);
              return returnNalBuf;
            } else {
              onceGetNalCount -= 1;
            }
          }
        }
      } // end for


      return false;
    }
    /**
     * @brief sub nalu stream, and get Nalu unit
     *          to parse: 
     *           typedef struct {
     *               uint32_t width;
     *               uint32_t height;
     *               uint8_t *dataY;
     *               uint8_t *dataChromaB;
     *               uint8_t *dataChromaR;
     *           } ImageData;
     * @params struct_ptr: Module.cwrap('getFrame', 'number', [])
     * @return Dict
     */

  }, {
    key: "parseYUVFrameStruct",
    value: function parseYUVFrameStruct() {
      var struct_ptr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      // sub block [m,n]
      if (struct_ptr == null || !struct_ptr || struct_ptr == undefined) {
        return null;
      }

      var width = Module.HEAPU32[struct_ptr / 4];
      var height = Module.HEAPU32[struct_ptr / 4 + 1]; // let imgBufferPtr    = Module.HEAPU32[ptr / 4 + 2];
      // let imageBuffer     = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + width * height * 3);
      // console.log("width:",width," height:",height);

      var sizeWH = width * height; // let imgBufferYPtr   = Module.HEAPU32[ptr / 4 + 2];
      // let imageBufferY    = Module.HEAPU8.subarray(imgBufferYPtr, imgBufferYPtr + sizeWH);
      // let imgBufferBPtr   = Module.HEAPU32[ptr/4+ 2 + sizeWH/4 + 1];
      // let imageBufferB    = Module.HEAPU8.subarray(
      //     imgBufferBPtr, 
      //     imgBufferBPtr + sizeWH/4
      // );
      // console.log(imageBufferB);
      // let imgBufferRPtr   = Module.HEAPU32[imgBufferBPtr + sizeWH/16 + 1];
      // let imageBufferR    = Module.HEAPU8.subarray(
      //     imgBufferRPtr, 
      //     imgBufferRPtr + sizeWH/4
      // );

      var imgBufferPtr = Module.HEAPU32[struct_ptr / 4 + 1 + 1];
      var imageBufferY = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + sizeWH);
      var imageBufferB = Module.HEAPU8.subarray(imgBufferPtr + sizeWH + 8, imgBufferPtr + sizeWH + 8 + sizeWH / 4);
      var imageBufferR = Module.HEAPU8.subarray(imgBufferPtr + sizeWH + 8 + sizeWH / 4 + 8, imgBufferPtr + sizeWH + 8 + sizeWH / 2 + 8);
      return {
        width: width,
        height: height,
        sizeWH: sizeWH,
        imageBufferY: imageBufferY,
        imageBufferB: imageBufferB,
        imageBufferR: imageBufferR
      };
    }
  }]);

  return RawParserModule;
}();

exports["default"] = RawParserModule;

},{}],2:[function(require,module,exports){
"use strict";

var _rawParser = _interopRequireDefault(require("./dist/raw-parser.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// console.log("import parse worker!!!", RawParserModule);
var g_RawParser = new _rawParser["default"]();

onmessage = function onmessage(event) {
  // console.log("parse - worker.onmessage", event);
  var body = event.data;
  var cmd = null;

  if (body.cmd === undefined || body.cmd === null) {
    cmd = '';
  } else {
    cmd = body.cmd;
  } // console.log("parse - worker recv cmd:", cmd);


  switch (cmd) {
    case 'append-chunk':
      // console.log("parse - worker append-chunk");
      var chunk = body.data;
      g_RawParser.appendStreamRet(chunk);
      break;

    case 'get-nalu':
      // let nalBuf = g_RawParser.nextNalu();
      var nalBuf = g_RawParser.nextFrame(); // console.log("parse - worker get-nalu", nalBuf);
      // if (nalBuf != false) {

      postMessage({
        cmd: "return-nalu",
        data: nalBuf,
        msg: "return-nalu"
      }); // }

      break;

    case 'stop':
      // console.log("parse - worker stop");
      postMessage('parse - WORKER STOPPED: ' + body);
      close(); // Terminates the worker.

      break;

    default:
      // console.log("parse - worker default");
      // console.log("parse - worker.body -> default: ", body);
      // worker.postMessage('Unknown command: ' + data.msg);
      break;
  }

  ;
};

},{"./dist/raw-parser.js":1}]},{},[2]);
