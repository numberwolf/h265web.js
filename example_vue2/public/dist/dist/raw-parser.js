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
const AfterGetNalThenMvLen  = 3;

export default class RawParserModule {
    constructor() {
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
    pushFrameRet(streamPushInput) {
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

    nextFrame() {
        if (!this.frameList && this.frameList == undefined || this.frameList == null && this.frameList.length < 1) {
            return null;
        }
        return this.frameList.shift();
    }

    clearFrameRet() {
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
    setStreamRet(streamBufInput) {
        this.stream = streamBufInput;
    }

    getStreamRet() {
        return this.stream;
    }

    /**
     * push stream nalu, for live, not vod
     * @param Uint8Array
     * @return bool
     */
    appendStreamRet(input) {
        if (!input || input === undefined || input == null) {
            return false;
        }

        if (!this.stream || this.stream === undefined || this.stream == null) {
            this.stream = input;
            return true;
        }

        let lenOld  = this.stream.length;
        let lenPush = input.length;

        let mergeStream = new Uint8Array(lenOld + lenPush);
        mergeStream.set(this.stream, 0);
        mergeStream.set(input, lenOld);

        this.stream = mergeStream;

        // let retList = this.nextNaluList(9000);
        // if (retList !== false && retList.length > 0) {
        //     this.frameList.push(...retList);
        // }

        for (let i = 0; i < 9999; i++) {
            let nalBuf = this.nextNalu();
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
    subBuf(startOpen, endOpen) { // sub block [m,n]
        // nal
        let returnBuf = new Uint8Array(
            this.stream.subarray(startOpen, endOpen + 1)
        );

        // streamBuf sub
        this.stream = new Uint8Array(
            this.stream.subarray(endOpen + 1)
        );

        return returnBuf;
    }

    /**
     * @param onceGetNalCount: once use get nal count, defult 1
     * @return uint8array OR false
     */
    nextNalu(onceGetNalCount=1) {

        // check params
        if (this.stream == null || this.stream.length <= 4) {
            return false;
        }

        // start nal pos
        let startTag = -1;
        // return nalBuf
        let returnNalBuf = null;

        for (let i = 0;i < this.stream.length; i++) {
            if (i + 5 >= this.stream.length) {
                return false;
                // if (startTag == -1) {
                //     return false;
                // } else {
                //     // 如果结尾不到判断的字节位置 就直接全量输出最后一个nal
                //     returnNalBuf = this.subBuf(startTag, this.stream.length-1);
                //     return returnNalBuf;
                // }
            }

            // find nal
            if (
                (   // 0x00 00 01
                    this.stream[i]        == 0
                    && this.stream[i+1]   == 0
                    && this.stream[i+2]   == 1
                ) || 
                (   // 0x00 00 00 01
                    this.stream[i]        == 0
                    && this.stream[i+1]   == 0
                    && this.stream[i+2]   == 0
                    && this.stream[i+3]   == 1
                )
            ) {
                // console.log(
                //     "enter find nal , now startTag:" + startTag 
                //     + ", now pos:" + i
                // );
                let nowPos = i;
                i += AfterGetNalThenMvLen; // 移出去
                // begin pos
                if (startTag == -1) {
                    startTag = nowPos;
                } else {
                    if (onceGetNalCount <= 1) {
                        // startCode - End
                        // [startTag,nowPos)
                        // console.log("[===>] last code hex is :" + this.stream[nowPos-1].toString(16))
                        returnNalBuf = this.subBuf(startTag,nowPos-1);
                        return returnNalBuf;
                    } else {
                        onceGetNalCount -= 1;
                    }
                }
            }

        } // end for

        return false;
    }

    nextNalu2(onceGetNalCount=1) {
        // check params
        if (this.stream == null || this.stream.length <= 4) {
            return false;
        }

        // start nal pos
        let startTag = -1;
        // return nalBuf
        let returnNalBuf = null;

        for (let i = 0;i < this.stream.length; i++) {
            if (i + 5 >= this.stream.length) {
                if (startTag == -1) {
                    return false;
                } else {
                    // 如果结尾不到判断的字节位置 就直接全量输出最后一个nal
                    returnNalBuf = this.subBuf(startTag,this.stream.length-1);
                    return returnNalBuf;
                }
            }

            // find nal
            let is3BitHeader = this.stream.slice(i, i+3).join(' ') == '0 0 1';
            let is4BitHeader = this.stream.slice(i, i+4).join(' ') == '0 0 0 1';
            if (
                is3BitHeader || 
                is4BitHeader
            ) {
                let nowPos = i;
                i += AfterGetNalThenMvLen; // 移出去
                // begin pos
                if (startTag == -1) {
                    startTag = nowPos;
                } else {
                    if (onceGetNalCount <= 1) {
                        // startCode - End
                        // [startTag,nowPos)
                        // console.log("[===>] last code hex is :" + this.stream[nowPos-1].toString(16))
                        returnNalBuf = this.subBuf(startTag, nowPos-1);
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
    parseYUVFrameStruct(struct_ptr = null) { // sub block [m,n]
        if (struct_ptr == null || !struct_ptr || struct_ptr == undefined) {
            return null;
        }

        let width           = Module.HEAPU32[struct_ptr / 4];
        let height          = Module.HEAPU32[struct_ptr / 4 + 1];
        // let imgBufferPtr    = Module.HEAPU32[ptr / 4 + 2];
        // let imageBuffer     = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + width * height * 3);
        // console.log("width:",width," height:",height);

        let sizeWH          = width * height;
        // let imgBufferYPtr   = Module.HEAPU32[ptr / 4 + 2];
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

        let imgBufferPtr = Module.HEAPU32[struct_ptr / 4 + 1 + 1];

        let imageBufferY = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + sizeWH);

        let imageBufferB = Module.HEAPU8.subarray(
            imgBufferPtr + sizeWH + 8, 
            imgBufferPtr + sizeWH + 8 + sizeWH/4
        );

        let imageBufferR = Module.HEAPU8.subarray(
            imgBufferPtr + sizeWH + 8 + sizeWH/4 + 8,
            imgBufferPtr + sizeWH + 8 + sizeWH/2 + 8
        );

        return {
            width           : width,
            height          : height,
            sizeWH          : sizeWH,
            imageBufferY    : imageBufferY,
            imageBufferB    : imageBufferB,
            imageBufferR    : imageBufferR
        };
    }

}
