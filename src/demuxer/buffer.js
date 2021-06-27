/********************************************************* 
 * LICENSE: GPL-3.0 https://www.gnu.org/licenses/gpl-3.0.txt
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
const BUFFER_FRAME = require('./bufferFrame');
// buffer
module.exports = () => {
	let bufferModule = {
		/**
		 * [
		 *	[{pts: 0.01, isKey: true, data: uint8array(...)}, {}, ..., {}] 0 sec / index
		 * 	[...] 1 sec
		 * 	[...] 2 sec
		 * 	...
		 * ]
		 */
		videoBuffer: [],
		audioBuffer: [],
		/**
		 * Idr s
		 * [0.00, ..., {pts}]
		 */
		idrIdxBuffer: []
	};
	bufferModule.appendFrame = (pts, data, video = true, isKey = false) => {
		let frame = new BUFFER_FRAME.BufferFrame(pts, isKey, data, video);
		let idxPts = parseInt(pts);
		if (video) {
			if (bufferModule.videoBuffer.length - 1 >= idxPts) {
				bufferModule.videoBuffer[idxPts].push(frame);
			} else {
				bufferModule.videoBuffer.push([frame]);
			}
			if (isKey && !bufferModule.idrIdxBuffer.includes(pts)) {
				bufferModule.idrIdxBuffer.push(pts);
			}
        } else {
        	// audio
        	if (bufferModule.audioBuffer.length - 1 >= idxPts 
        		&& bufferModule.audioBuffer[idxPts] != undefined 
        		&& bufferModule.audioBuffer[idxPts] != null) {
        		if (bufferModule.audioBuffer[idxPts]) {
					bufferModule.audioBuffer[idxPts].push(frame);
				}
			} else {
				bufferModule.audioBuffer.push([frame]);
			}
        }

        return true;
	};
	/*
	 * CNative内核专用，dts索引
	 */
	bufferModule.appendFrameWithDts = (pts, dts, data, video = true, isKey = false) => {
		let frame = BUFFER_FRAME.ConstructWithDts(pts, dts, isKey, data, video);
		let idxPts = parseInt(dts);
		if (video) {
			if (bufferModule.videoBuffer.length - 1 >= idxPts) {
				bufferModule.videoBuffer[idxPts].push(frame);
			} else {
				bufferModule.videoBuffer.push([frame]);
			}
			if (isKey && !bufferModule.idrIdxBuffer.includes(dts)) {
				bufferModule.idrIdxBuffer.push(dts);
			}
        } else {
        	// audio
        	if (bufferModule.audioBuffer.length - 1 >= idxPts 
        		&& bufferModule.audioBuffer[idxPts] != undefined 
        		&& bufferModule.audioBuffer[idxPts] != null) {
        		if (bufferModule.audioBuffer[idxPts]) {
					bufferModule.audioBuffer[idxPts].push(frame);
				}
			} else {
				bufferModule.audioBuffer.push([frame]);
			}
        }

        return true;
	};
	// by object
	bufferModule.appendFrameByBufferFrame = (bufFrame) => {
		let pts = bufFrame.pts;
		let idxPts = parseInt(pts);
		if (bufFrame.video) {
			if (bufferModule.videoBuffer.length - 1 >= idxPts) {
				bufferModule.videoBuffer[idxPts].push(bufFrame);
			} else {
				bufferModule.videoBuffer.push([bufFrame]);
			}
			if (isKey && !bufferModule.idrIdxBuffer.includes(pts)) {
				bufferModule.idrIdxBuffer.push(pts);
			}
        } else {
        	// audio
        	if (bufferModule.audioBuffer.length - 1 >= idxPts) {
				bufferModule.audioBuffer[idxPts].push(bufFrame);
			} else {
				bufferModule.audioBuffer.push([bufFrame]);
			}
        }

        return true;
	};
	bufferModule.cleanPipeline = () => {
		bufferModule.videoBuffer.length = 0;
		bufferModule.audioBuffer.length = 0;
	};
	bufferModule.vFrame = (ptsec = -1) => {
		if (ptsec < 0 || ptsec > bufferModule.videoBuffer.length - 1) {
			return;
		}
		return bufferModule.videoBuffer[ptsec];
	};
	bufferModule.aFrame = (ptsec = -1) => {
		if (ptsec < 0 || ptsec > bufferModule.audioBuffer.length - 1) {
			return;
		}
		return bufferModule.audioBuffer[ptsec];
	};
	bufferModule.seekIDR = (pts = -1.0) => {
		console.log("IDR Buffer:", bufferModule.idrIdxBuffer);
		// console.log(bufferModule.videoBuffer);
		// console.log("seek target => ", pts);
		// console.log(bufferModule.idrIdxBuffer);
		if (pts < 0) {
			return null;
		}
		// let idxPts = parseInt(pts);
		// let idrIdx = bufferModule.idrIdxBuffer.indexOf(pts);
		if (bufferModule.idrIdxBuffer.includes(pts)) {
			return pts;
		} else {
			// Find IDR Frame Position
			for (let i = 0; i < bufferModule.idrIdxBuffer.length; i++) {
				/**
				 * |-----[last]|
				 *        ^ 
				 * |-----[i] [i+1]----|
				 *          ^ <- pts
				 */
				if (i === bufferModule.idrIdxBuffer.length - 1 || 
					(bufferModule.idrIdxBuffer[i] < pts && bufferModule.idrIdxBuffer[i+1] > pts) ||
					(i === 0 && bufferModule.idrIdxBuffer[i] >= pts)
				) {

					for (let j = 1; j >= 0; j--) {
						let idxFind = i - j;
						if (idxFind >= 0) {
							return bufferModule.idrIdxBuffer[idxFind];
						}
					}
					return bufferModule.idrIdxBuffer[i];
				}
			} // end for
		}
	};

	return bufferModule;
}