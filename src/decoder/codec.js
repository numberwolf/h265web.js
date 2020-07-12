/**
 * codecImp Obj
 * Video
 */
const AfterGetNalThenMvLen  = 3;

/**
 * @brief: construct
 */
function CodecImp() {
	// Class Object
}

/*
 * =============================== hevc list
 */
CodecImp.prototype.pushFrameRet = function(streamPushInput) {
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
};

CodecImp.prototype.nextFrame = function() {
    if (!this.frameList && this.frameList == undefined || this.frameList == null && this.frameList.length < 1) {
        return null;
    }
    return this.frameList.shift();
};

CodecImp.prototype.clearFrameRet = function() {
    this.frameList  = null;
};

/*
 * =============================== hevc stream
 */
CodecImp.prototype.setStreamRet = function(streamBufInput) {
	this.stream = streamBufInput;
};

CodecImp.prototype.getStreamRet = function() {
	return this.stream;
};

/**
 * push stream nalu, for live, not vod
 * @param Uint8Array
 */
CodecImp.prototype.pushStreamRet = function(streamPushInput) {
	if (!streamPushInput || streamPushInput == undefined || streamPushInput == null) {
		return false;
	}

	if (!this.stream || this.stream == undefined || this.stream == null) {
		this.stream = streamPushInput;
		return true;
	}

	var lenOld 	= this.stream.length;
	var lenPush = streamPushInput.length;

	var mergeStream = new Uint8Array(lenOld + lenPush);
	mergeStream.set(this.stream, 0);
	mergeStream.set(streamPushInput, lenOld);

	this.stream = mergeStream;

	return true;
};

CodecImp.prototype.clearStreamRet = function() {
    this.stream     = null;
};


/**
 * sub nalu stream, and get Nalu unit
 */
CodecImp.prototype.subBuf = function(startOpen,endOpen) { // sub block [m,n]
	// nal
    var returnBuf = new Uint8Array(
        this.stream.subarray(startOpen,endOpen+1)
    );

    // streamBuf sub
    this.stream = new Uint8Array(
        this.stream.subarray(endOpen+1)
    );

    return returnBuf;
};

/**
 * @param onceGetNalCount: once use get nal count, defult 1
 * @return uint8array OR false
 */
CodecImp.prototype.nextNalu = function(onceGetNalCount=1) {

    // check params
    if (this.stream == null || this.stream.length <= 4) {
        return false;
    }

    // start nal pos
    var startTag = -1;
    // return nalBuf
    var returnNalBuf = null;

    for (var i = 0;i < this.stream.length; i++) {
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
                    returnNalBuf = this.subBuf(startTag,nowPos-1);
                    return returnNalBuf;
                } else {
                    onceGetNalCount -= 1;
                }
            }
        }

    } // end for

    return false;
};


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
CodecImp.prototype.parseFrameStruct = function(struct_ptr = null) { // sub block [m,n]
    if (struct_ptr == null || !struct_ptr || struct_ptr == undefined) {
        return null;
    }

    var width           = Module.HEAPU32[struct_ptr / 4];
    var height          = Module.HEAPU32[struct_ptr / 4 + 1];
    // let imgBufferPtr    = Module.HEAPU32[ptr / 4 + 2];
    // let imageBuffer     = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + width * height * 3);
    // console.log("width:",width," height:",height);

    var sizeWH          = width * height;
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

    var imgBufferPtr = Module.HEAPU32[struct_ptr / 4 + 1 + 1];

    var imageBufferY = Module.HEAPU8.subarray(imgBufferPtr, imgBufferPtr + sizeWH);

    var imageBufferB = Module.HEAPU8.subarray(
        imgBufferPtr + sizeWH + 8, 
        imgBufferPtr + sizeWH + 8 + sizeWH/4
    );

    var imageBufferR = Module.HEAPU8.subarray(
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
};



