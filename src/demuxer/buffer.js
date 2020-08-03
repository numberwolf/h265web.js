// buffer
module.exports = () => {
	const bufferModule = {
		/**
		 * [
		 *	[{pts: 0.01, isKey: true, data: uint8array(...)}, {}, ..., {}] 0 sec / index
		 * 	[...] 1 sec
		 * 	[...] 2 sec
		 * 	...
		 * ]
		 */
		videoBuffer: [],
		audioBuffer: []
	};
	bufferModule.appendFrame = (pts, data, video = true, isKey = false) => {
		let frame = null;
		frame = {
			pts : pts,
			data : data,
			isKey : isKey
		};
		let idxPts = parseInt(pts);
		if (video) {
			if (bufferModule.videoBuffer.length - 1 >= idxPts) {
				bufferModule.videoBuffer[idxPts].push(frame);
			} else {
				bufferModule.videoBuffer.push([frame]);
			}
        } else {
        	// audio
        	if (bufferModule.audioBuffer.length - 1 >= idxPts) {
				bufferModule.audioBuffer[idxPts].push(frame);
			} else {
				bufferModule.audioBuffer.push([frame]);
			}
        }
	};
	bufferModule.cleanPipeline = () => {
		bufferModule.videoBuffer.length = 0;
		bufferModule.audioBuffer.length = 0;
	};

	return bufferModule;
}