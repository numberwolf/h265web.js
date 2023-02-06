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
class AACDecoderModule {
	constructor(config) {
		this.sampleRate = config.sampleRate;
		this.frameDurMs = Math.floor(1024.0 * 1000.0 / this.sampleRate);
		this.frameDurSec = this.frameDurMs / 1000.0;
	}

	updateConfig(config) {
		this.sampleRate = config.sampleRate;
		this.frameDurMs = 1024.0 * 1000.0 / this.sampleRate;
		this.frameDurSec = this.frameDurMs / 1000.0;
	}

	_getPktLen(u0, u1, u2) {
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

    	let num1 = (u0 & 0x03) << 11; // 00000011
    	let num2 = u1 << 3;
    	let num3 = (u2 & 0xE0) >> 5; // 11100000

    	let pkgLen = num1 + num2 + num3;

    	// console.log("cal pkg len: " , num1 + num2 + num3);

    	return pkgLen;

	}

	// uint8
	sliceAACFrames(startTime, dataPacket) { // static
		let _this = this;
		/*
		 * [
		 *		{"ptime" : 0.001, "data" : xxx},
		 *		...
		 * ]
		 */
		let dataInfo = [];
        // console.log("dataPacket:", dataPacket.length);
        // let defbug_len = 0;

        // let startIdx = -1;
        let startIdxTime = startTime;

        for (let i = 0; i < dataPacket.length - 1;) {
			// if (i == dataPacket.length - 2) { // [... , fin - 1 , fin]
			// 	// console.log("Get Frame");
			// 	startIdx = startIdx < 0 ? 0 : startIdx;

			// 	let len = dataPacket.length - startIdx; // between startIdx, lastIdx
			// 	// defbug_len += len;
			// 	let tempBuf = dataPacket.subarray(startIdx, i+1);
			// 	let buf = new Uint8Array(len);
			// 	buf.set(tempBuf, 0);
			// 	startIdx = i;
			// 	dataInfo.push({
			// 		ptime : startIdxTime,
			// 		data : buf
			// 	});

			// 	break;
			// }
            // last frame check
            if (dataPacket[i] == 0xFF && (dataPacket[i+1] >> 4) == 0x0F) {

            	// get aac frame split slice by 0xFFF, but we use 0xFF 0xF1
	            // @TODO 0xFFF , val >> 4 == 0x0F
	            // if (dataPacket[i] == 0xFF && dataPacket[i+1] == 0xF1) {

            	let pktLen = _this._getPktLen(dataPacket[i+3], dataPacket[i+4], dataPacket[i+5]);
                if (pktLen <= 0) {
                    continue;
                }
            	// console.log(dataPacket[i+pktLen], dataPacket[i+pktLen+1]);

            	// defbug_len += pktLen;

            	let tempBuf = dataPacket.subarray(i, i + pktLen); // [n, m)
            	let buf = new Uint8Array(pktLen);
                buf.set(tempBuf, 0);

                dataInfo.push({
                	ptime : startIdxTime,
                	data : buf
                });

                startIdxTime += _this.frameDurSec;

                i += pktLen;
            } else {
            	i += 1;
            }
        } // end for

        // console.log("debuglen:", defbug_len);

        return dataInfo;
	}
}

exports.AACDecoder = AACDecoderModule;
