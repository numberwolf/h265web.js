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
const def = require('../consts');
class Mp4PlayerModule {
	constructor(config) {
		this.configFormat = {
            width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            fps: config.fps || def.DEFAULT_FPS,
            fixed: config.fixed || def.DEFAULT_FIXED,
            sampleRate: config.sampleRate || def.DEFAULT_SAMPLERATE,
            appendHevcType: config.appendHevcType || def.APPEND_TYPE_STREAM,
            frameDurMs: config.frameDur || def.DEFAULT_FRAME_DUR, // got ms
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            audioNone: config.audioNone || false,
            token: config.token || null,
            videoCodec: config.videoCodec || def.CODEC_H265
        };

        this.video = null;
        this.isPlaying = false;
        this.duration = -1;
        // this.fps = -1;

        this.onLoadFinish = null;
        this.onPlayingTime = null;
        this.onPlayingFinish = null;

        // this.onPlayUpdatePTSInterval = null;
	}

	makeIt(url) {
		// native
		let _this = this;

        let canvasBox = document.querySelector('div#' + this.configFormat.playerId);
        this.video = document.createElement('video');

        this.video.ontimeupdate = () => {
        	console.log("ontimeupdate");
			_this.onPlayingTime && _this.onPlayingTime(_this.video.currentTime);
		};

		this.video.onended = () => {
			console.log("onended");
			_this.onPlayingFinish && _this.onPlayingFinish();
		};

		this.video.onloadedmetadata = () => {
			alert("loadedmetadata");
			_this.duration = _this.video.duration;
			_this.onLoadFinish && _this.onLoadFinish();
		};

        this.video.src = url;
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        canvasBox.appendChild(this.video);
	}

	play() {
		let _this = this;
		this.video.play();
	}

	seek(pts) {
		console.log("SEEK:", pts);
		this.video.currentTime = pts;
	}

	pause() {
		this.video.pause();
	}

	setVoice(volume) {
		this.video.volume = volume;
	}

	isPlayingState() {
		return !this.video.paused;
	}

};

exports.Mp4Player = Mp4PlayerModule;