const def = require('../consts');

// #EXTM3U
// #EXT-X-VERSION:3
// #EXT-X-MEDIA-SEQUENCE:1116126
// #EXT-X-TARGETDURATION:10
// #EXTINF:10.000,
// cctv1hd-1598889356000.ts
// #EXTINF:10.000,
// cctv1hd-1598889366000.ts
// #EXTINF:10.000,
// cctv1hd-1598889376000.ts
// #EXTINF:10.000,
// cctv1hd-1598889386000.ts
// #EXTINF:10.000,
// cctv1hd-1598889396000.ts
// #EXTINF:10.000,
// cctv1hd-1598889406000.ts
// ...
// #EXT-X-ENDLIST <-- vod, if live will not include this tag

const matchers = {
	lineDelimiter: /\r?\n/,
	extensionHeader: '#EXTM3U',
	tagPrefix: '#EXT',
	segmentPrefix: '#EXTINF',
	segmentParse: /^#EXTINF: *([0-9.]+)(, *(.+?)?)?$/,
	tagParse: /^#EXT-X-([A-Z-]+)(:(.+))?$/,
	version: 'VERSION',
	allowCache: 'ALLOW-CACHE',
	combined: 'COMBINED',
	endList: 'ENDLIST',
	targetDuration: 'TARGETDURATION',
	mediaSequence: 'MEDIA-SEQUENCE',
	discontinuity: 'DISCONTINUITY',
	streamInf: 'STREAM-INF',
	isComment: (line) => line && line[0] === '#' && !(line.startsWith(matchers.tagPrefix)),
	isBlank: (line) => line === '',
	canStrip: (line) => matchers.isBlank(line) || matchers.isComment(line),
	defaultMinDur : 99999,
	hlsSliceLimit : 100
}

class M3u8BaseParserModule {
	constructor() {
		this._slices = [];
		// default is Live HLS
		this._type = def.PLAYER_IN_TYPE_M3U8_LIVE;
		this._preURI = "";
		this.duration = -1;

		// event
		this.onTransportStream = null;
		/*
		 * event of after every file parse
		 * {...}
		 */
		this.onFinished = null;
	}

	fetchM3u8(videoURL) {
		let _this = this;
		// fetch('http://ivi.bupt.edu.cn/hls/cctv1hd.m3u8')
		fetch(videoURL)
  		.then(res => res.text())
  		.then(hlsBody => {
  			// console.log(hlsBody);
  			let uriParseRet = _this._uriParse(videoURL);
  			if (uriParseRet == true) {
  				return _this._m3u8Parse(hlsBody);
  			} else {
  				console.log("Parse URL ERROR : " + videoURL);
  				return null;
  			}
  		})
  		.then(minDur => {
  			if (minDur != null && this._type == def.PLAYER_IN_TYPE_M3U8_LIVE) {
				setTimeout(() => {
					_this.fetchM3u8(videoURL);
				}, minDur * 1000);
			}
  		});
	}

	_uriParse(videoURL) {
		this._preURI = "";

		let headPart = videoURL.split("//");
		let subPartProtocal = null;
		let subPartBody = null;

		if (headPart.length < 1) {
			console.log("HLS URI ERROR : " + videoURL);
			return false;
		}

		if (headPart.length > 1) {
			subPartProtocal = headPart[0];
			subPartBody = headPart[1].split("/");
			this._preURI = subPartProtocal + "//";
		} else {
			subPartBody = headPart[0].split("/");
		}

		for (var i = 0; i < subPartBody.length - 1; i++) {
			this._preURI += subPartBody[i] + "/";
		}
		// console.log("pre uri ", this._preURI);

		return true;
	}

	// return ts item list
	_m3u8Parse(hlsBody) {
		let _this = this;

		let lines = hlsBody.split(matchers.lineDelimiter);
		let minDur = matchers.defaultMinDur;

		for (var i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.length < 1) {
				continue;
			}
			// console.log(i, line);

			let tagParse = this._readTag(line);
			if (tagParse != null) {
				// console.log(tagParse);
				/*
				 * Tag Deal
				 */
				switch (tagParse.key) {
					case matchers.version:
						break;
					case matchers.mediaSequence:
						break;
					case matchers.allowCache:
						break;
					case matchers.discontinuity:
						break;
					case matchers.targetDuration:
						break;
					case matchers.combined:
						break;
					case matchers.streamInf:
						break;
					case matchers.endList:
						this._type = def.PLAYER_IN_TYPE_M3U8_VOD;
						if (this.onFinished != null) {
							let callFinData = {
								type : this._type,
								duration : this.duration
							}
							this.onFinished(callFinData);
						}
						return true; // end
					default:
						console.log("unknow tag" + tagParse.key);
				}
			}

			let segmentParse = matchers.segmentParse.exec(line);
			if (segmentParse != null) {
				let segmentDur = segmentParse[1];
				this.duration += parseFloat(segmentParse[1]);
				if (minDur > segmentDur) {
					minDur = segmentDur;
				}
				// console.log(segmentParse);
				// console.log("segment: " + line);
				i += 1; // pointer to media file

				let mediaFile = lines[i];
				let mediaURI = this._preURI + mediaFile;

				if (this._slices.indexOf(mediaURI) < 0) {
					this._slices.push(mediaURI);

					if (this.onTransportStream != null) {
						this.onTransportStream(mediaURI, segmentDur);
					}
				}

				// test
				// fetch(mediaURI).then(res => res.arrayBuffer()).then(streamBuffer => {
				// 	console.log(streamBuffer);
				// });
			}

		} // end for

		if (this._slices.length > matchers.hlsSliceLimit && 
			this._type == def.PLAYER_IN_TYPE_M3U8_LIVE) {
			this._slices = this._slices.slice(-1 * matchers.hlsSliceLimit);
			// console.log(
			// 	this._slices.length, 
			// 	this._slices[this._slices.length - 2], 
			// 	this._slices[this._slices.length - 1]);
		}

		// console.log(this._slices);
		// console.log(minDur, this._type);

		if (this.onFinished != null) {
			let callFinData = {
				type : this._type,
				duration : -1
			}
			this.onFinished(callFinData);
		}

		return minDur;
	}

	_readTag(line) {
		let parsed = matchers.tagParse.exec(line);
		if (parsed !== null) {
			return {
				key: parsed[1],
				value: parsed[3]
			};
		}

		return null;
	 }


}

exports.M3u8Base = M3u8BaseParserModule;