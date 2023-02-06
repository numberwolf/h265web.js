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

const removeTags = [
	/#EXT-X-PROGRAM-DATE-TIME.+\n/g,
];

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
		this.initState = true;
		this.controller = new AbortController();

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

	isLive() {
		if (this._type === def.PLAYER_IN_TYPE_M3U8_LIVE) {
			return 1
		}
		return 0;
	}

	release() {
		this.initState = false;
	}

	fetchM3u8(videoURL) {
		let _this = this;
		if (!this.initState) {
			return;
		}
		// let signal = this.controller.signal;
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
  			if (minDur != null 
  				&& minDur !== false && minDur !== true 
  				&& this._type == def.PLAYER_IN_TYPE_M3U8_LIVE) {
				setTimeout(() => {
					_this.fetchM3u8(videoURL);
				}, minDur * 500);
			}
  		}).catch(error => {
            console.error("fetchM3u8 ERROR fetch ERROR ==> ", error);
            alert("fetchM3u8 ERROR fetch ERROR ==> ");
            alert(error);

			setTimeout(() => {
				_this.fetchM3u8(videoURL);
			}, 500);
        });
	}

	_uriParse(videoURL) {
		this._preURI = "";

		let headPart = videoURL.split("://");
		let subPartProtocal = null;
		let subPartBody = null;

		if (headPart.length < 1) {
			console.log("HLS URI ERROR : " + videoURL);
			return false;
		}

		if (headPart.length > 1) {
			subPartProtocal = headPart[0];
			subPartBody = headPart[1].split("/");
			this._preURI = subPartProtocal + "://";
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
	_m3u8Parse(p_hlsBody) {
		let _this = this;

		let hlsBody = p_hlsBody;

		for (let i = 0; i < removeTags.length; i++) {
			console.log(removeTags[i]);
			hlsBody = p_hlsBody.replace(removeTags[i], '');
		}
		console.log(hlsBody);

		let lines = hlsBody.split(matchers.lineDelimiter);
		let minDur = matchers.defaultMinDur;

		let beforeTag = "";
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.length < 1) {
				continue;
			}
			// console.log(i, line);

			// before Line
			if (beforeTag !== undefined && beforeTag !== null && beforeTag !== "") {
				switch (beforeTag) {
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
						// console.warn("matchers beforeTag streamInf===>", line);
						_this.fetchM3u8(line);
						return null; // todo
					default:
						console.log("unknow beforeTag " + beforeTag);
				}
			}

			// Now Line
			let tagParse = this._readTag(line);
			if (tagParse != null) {
				beforeTag = tagParse.key;
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
						// console.log("matchers streamInf===>", line);
						break; // todo
					case matchers.endList:
						this._type = def.PLAYER_IN_TYPE_M3U8_VOD;
						if (this.onFinished != null) {
							let callFinData = {
								type : this._type,
								duration : this.duration
							}
							this.onFinished(callFinData);
						}
						// console.warn("matchers finished", line);
						return true; // end
					default:
						console.log("unknow tag" + tagParse.key);
				}
			}

			let segmentParse = matchers.segmentParse.exec(line);
			// console.warn("------>matchers segmentParse", line, segmentParse);
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
				let mediaURI = null;
				if (mediaFile.indexOf("http") >= 0) {
					mediaURI = mediaFile;
				} else {
					// compatible -> /xxx/sss absolute path
					if (mediaFile[0] === '/') {
						const httpHostSplit = this._preURI.split("//");
						const hostSplit = httpHostSplit[httpHostSplit.length-1].split('/'); // remove http

						this._preURI = httpHostSplit[0] + "//" + hostSplit[0];
						// this._preURI = "";
						// for (let httpHostSplitIdx = 0; 
						// 	httpHostSplitIdx < httpHostSplit.length; 
						// 	httpHostSplitIdx++) 
						// {
						// 	this._preURI += httpHostSplit[httpHostSplitIdx];
						// } // end for httpHostSplitIdx
						// this._preURI += hostSplit[0];
					}
					mediaURI = this._preURI + mediaFile;
				}

				// console.warn("------>matchers segmentParse mediaURI", mediaURI);

				if (this._slices.indexOf(mediaURI) < 0) {
					this._slices.push(mediaURI);

					console.warn("------>push segmentParse mediaURI", this._slices[this._slices.length - 1], mediaURI);

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
