class BufferFrameStruct {
	constructor(pts, isKey, data, video) {
		this.pts 	= pts;
		this.isKey 	= isKey;
		this.data 	= data;
		this.video 	= video;
	}

	setFrame(pts, isKey, data, video){
		this.pts 	= pts;
		this.isKey 	= isKey;
		this.data 	= data;
		this.video 	= video;
	}
}

exports.BufferFrame = BufferFrameStruct;



