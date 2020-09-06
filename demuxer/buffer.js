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
			if (isKey) {
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
			if (isKey) {
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
		// console.log("seek => ", pts);
		// console.log(bufferModule.idrIdxBuffer);
		if (pts < 0) {
			return null;
		}
		let idxPts = parseInt(pts);
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
				if (i == bufferModule.idrIdxBuffer.length ||
					bufferModule.idrIdxBuffer[i] < pts && bufferModule.idrIdxBuffer[i+1] > pts) {
					return bufferModule.idrIdxBuffer[i];
				}
			} // end for
		}
	};

	return bufferModule;
}