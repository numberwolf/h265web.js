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
            videoCodec: config.videoCodec || def.CODEC_H265,
            autoPlay: config.autoPlay || false,
        };

        this.videoTag = null;
        this.isPlaying = false;
        this.duration = -1;
        // this.fps = -1;

        this.bufferInterval = null;

        this.onLoadFinish = null;
        this.onPlayingTime = null;
        this.onPlayingFinish = null;
        this.onPlayState = null;
        this.onCacheProcess = null;

        // this.onPlayUpdatePTSInterval = null;
	}

	makeIt(url) {
		// native
		let _this = this;

        let canvasBox = document.querySelector('div#' + this.configFormat.playerId);
        this.videoTag = document.createElement('video');
        // playbackRate = 1.0;

        if (this.configFormat.autoPlay === true) {
            this.videoTag.muted = "muted";
            this.videoTag.autoplay = "autoplay";
            window.onclick = document.body.onclick = function(e) {
                _this.videoTag.muted = false;
                console.log("video isPlay", _this.isPlayingState());
            };
        }

        this.videoTag.onplay = function() {
	        const playStateNow = _this.isPlayingState();
	        console.log("onplay video isPlay", playStateNow);
	        _this.onPlayState && _this.onPlayState(playStateNow);
	    };

	    this.videoTag.onpause = function() {
	        const playStateNow = _this.isPlayingState();
	        console.log("onpause video isPlay", playStateNow);
	        _this.onPlayState && _this.onPlayState(playStateNow);
	    };

        this.videoTag.ontimeupdate = () => {
        	console.log("ontimeupdate");
			_this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
		};

		this.videoTag.onended = () => {
			console.log("onended");
			_this.onPlayingFinish && _this.onPlayingFinish();
		};

		this.videoTag.onloadedmetadata = (e) => {
			console.log("mp4-player loadedmetadata", e);
			_this.duration = _this.videoTag.duration;
			_this.onLoadFinish && _this.onLoadFinish();

			if (_this.bufferInterval !== null) {
	            window.clearInterval(_this.bufferInterval);
	            _this.bufferInterval = null;
	        }

			_this.bufferInterval = window.setInterval(function() {
				const bufProgress = _this.videoTag.buffered.end(0);
				console.log("bufProgress", bufProgress);
				if (bufProgress >= _this.duration - 0.04) {
					_this.onCacheProcess && _this.onCacheProcess(_this.duration);
					window.clearInterval(_this.bufferInterval);
					return;
				}
				_this.onCacheProcess && _this.onCacheProcess(bufProgress);
			}, 200);
		};

        this.videoTag.src = url;
        this.videoTag.style.width = '100%';
        this.videoTag.style.height = '100%';
        canvasBox.appendChild(this.videoTag);
	}

	setPlaybackRate(rate=1.0) {
		if (rate <= 0.0 || 
			this.videoTag == undefined || this.videoTag === null) {
			return false;
		}
		// playbackRate
		this.videoTag.playbackRate = rate;
		return true;
	}

	getPlaybackRate() {
		if (this.videoTag == undefined || this.videoTag === null) {
			return 0;
		}
		return this.videoTag.playbackRate;
	}

	getSize() {
		const width = this.videoTag.videoWidth > 0 ? this.videoTag.videoWidth : this.configFormat.width;
        const height = this.videoTag.videoHeight > 0 ? this.videoTag.videoHeight : this.configFormat.height;
        return {
            width: width,
            height: height
        };
	}

	play() {
		let _this = this;
		this.videoTag.play();
	}

	seek(pts) {
		console.log("SEEK:", pts);
		this.videoTag.currentTime = pts;
	}

	pause() {
		this.videoTag.pause();
	}

	setVoice(volume) {
		this.videoTag.volume = volume;
	}

	isPlayingState() {
		return !this.videoTag.paused;
	}

	release() {
		this.videoTag && this.videoTag.remove();
		this.videoTag = null;
		this.onLoadFinish = null;
        this.onPlayingTime = null;
        this.onPlayingFinish = null;
        this.onPlayState = null;

        if (this.bufferInterval !== null) {
            window.clearInterval(this.bufferInterval);
            this.bufferInterval = null;
        }

        window.onclick = document.body.onclick = null;
	}

	nativeNextFrame() {
		let _this = this;
		if (this.videoTag !== undefined && this.videoTag !== null) {
			this.videoTag.currentTime += 1.0 / this.configFormat.fps;
		}
	} // nativeNextFrame

}; // Mp4PlayerModule

exports.Mp4Player = Mp4PlayerModule;
