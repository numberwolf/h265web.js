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
// const AVCommon 		= require('./av-common');
const def 			= require('../consts');
const VersionModule = require('../version');
const flvjs 		= require('flv.js');


class NvFlvjsCoreModule {
	constructor(config) {
		this.configFormat = {
			width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            ignoreAudio: config.ignoreAudio
        };
        this.audioVoice	= 1.0;

        this.myPlayerID = this.configFormat.playerId + '-flvjs';
        this.myPlayer = null;
        this.videoContaner = null;
        this.videoTag = null;

        /*
		 * Attribute
		 */
		this.duration		= -1;
		this.width 			= -1;
		this.height 		= -1;
		this.isPlaying 		= false;
		this.vCodecID 		= def.V_CODEC_NAME_AVC;
		this.audioNone		= false;

		this.showScreen		= false;

		this.playPTS		= 0;
		this.vCachePTS		= 0;
		this.aCachePTS		= 0;

        /*
         * Event @todo
         */
        this.onLoadFinish       = null;
        this.onPlayingTime 		= null;
        this.onPlayingFinish 	= null;
        // this.onSeekFinish 		= null;
        this.onReadyShowDone    = null;
    } // constructor

    _onVideoJsReady() {
        let _this = this;
        this.videoContaner = document.querySelector('#' + this.myPlayerID);
        this.videoTag = this.videoContaner.querySelector("video");
        this.videoTag.style.width = this.configFormat.width + 'px';
        this.videoTag.style.height = this.configFormat.height + 'px';

        console.log("this.videoTag==>", this.videoTag);

        this.duration = this.myPlayer.duration();
        alert("duration:" + this.duration === Infinity);

        this.onLoadFinish && this.onLoadFinish();
        this.onReadyShowDone && this.onReadyShowDone();

        // if (this.duration === Infinity) {
        //     this.play();
        // }

        this.myPlayer.on("progress", function() {
            console.log("正在请求数据 ", _this.myPlayer.buffered().length, _this.myPlayer.duration());
        });

        this.myPlayer.on("timeupdate", function() {
            console.log("正在播放 ", _this.videoTag.currentTime, _this.myPlayer.duration());
            _this.onPlayingTime && _this.onPlayingTime(_this.myPlayer.currentTime());
        });
    } // onVideoJsReady

    makeIt(url) {

        // native
        let _this = this;
        if (flvjs.isSupported()) {
            console.log("flvjs-core flvjs.isSupported");
        	let h265Container = document.querySelector('#' + this.configFormat.playerId);
	        this.videoTag = document.createElement('video');
	        this.videoTag.id = this.myPlayerID;
	        this.videoTag.style.width = this.configFormat.width + 'px';
        	this.videoTag.style.height = this.configFormat.height + 'px';
	        h265Container.appendChild(this.videoTag);

            this.videoTag.onloadedmetadata = () => {
                alert("this.videoTag.onloadedmetadata");
                if (isInitDecodeFrames === false && _this.videoTag.videoWidth > 0 && _this.videoTag.videoHeight > 0) 
                {
                    isInitDecodeFrames = true;
                    _this.width = _this.videoTag.videoWidth;
                    _this.height = _this.videoTag.videoHeight;
                    _this.duration =  _this.videoTag.duration;
                    alert(_this.duration);
                    _this.onLoadFinish && _this.onLoadFinish();
                    _this.onReadyShowDone && _this.onReadyShowDone();

                    _this.videoTag.ontimeupdate = () => {
                        console.log("ontimeupdate");
                        _this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
                    }; // ontimeupdate
                    _this.videoTag.onended = () => {
                        console.log("onended");
                        _this.onPlayingFinish && _this.onPlayingFinish();
                    }; // onended
                }
            }; // onloadedmetadata

	        let options = {
	            type: 'flv',
	            // url: 'http://localhost:8080/VideoMissile/VideoMissilePlayer/demo/res/jitui10.flv'
	            //url: 'http://182.61.31.119:8080/live/livestream.flv',
	            url: url,
	        }; // options
	        this.myPlayer = flvjs.createPlayer(options);

            let isInitDecodeFrames = false;

            this.myPlayer.on(flvjs.Events.MEDIA_INFO, function(res) {
                console.log("Events.MEDIA_INFO", res);
            });
            this.myPlayer.on(flvjs.Events.STATISTICS_INFO, function(res) {
                console.log("Events.STATISTICS_INFO", 
                    res, 
                    _this.videoTag.videoWidth, _this.videoTag.videoHeight,
                    _this.videoTag.duration);
                if (isInitDecodeFrames === false && _this.videoTag.videoWidth > 0 && _this.videoTag.videoHeight > 0) 
                {
                    isInitDecodeFrames = true;
                    _this.width = _this.videoTag.videoWidth;
                    _this.height = _this.videoTag.videoHeight;
                    _this.duration =  _this.videoTag.duration;
                    alert(_this.duration);
                    _this.onLoadFinish && _this.onLoadFinish();
                    _this.onReadyShowDone && _this.onReadyShowDone();

                    _this.videoTag.ontimeupdate = () => {
                        console.log("ontimeupdate");
                        _this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
                    }; // ontimeupdate
                    _this.videoTag.onended = () => {
                        console.log("onended");
                        _this.onPlayingFinish && _this.onPlayingFinish();
                    }; // onended
                }
            });
            this.myPlayer.on(flvjs.Events.SCRIPTDATA_ARRIVED, function(res) {
                console.log("Events.SCRIPTDATA_ARRIVED", res);
            });
	        this.myPlayer.on(flvjs.Events.METADATA_ARRIVED, function(res) {
                if (isInitDecodeFrames === false) 
                {
                    isInitDecodeFrames = true;
    	        	alert("METADATA_ARRIVED");
    	        	console.log("Events.METADATA_ARRIVED", res);
    	        	_this.duration = res.duration;
    	        	_this.width = res.width;
    	        	_this.height = res.height;
    	        	alert(_this.duration);
    	        	_this.onLoadFinish && _this.onLoadFinish();
            		_this.onReadyShowDone && _this.onReadyShowDone();

            		_this.videoTag.ontimeupdate = () => {
    		        	console.log("ontimeupdate");
    					_this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
    				}; // ontimeupdate
    				_this.videoTag.onended = () => {
    					console.log("onended");
    					_this.onPlayingFinish && _this.onPlayingFinish();
    				}; // onended
                }
	        }); // METADATA_ARRIVED
            this.myPlayer.on(flvjs.Events.ERROR, function(res) {
                console.log("Events.ERROR", res);
            });

	        this.myPlayer.attachMediaElement(this.videoTag);
	        this.myPlayer.load();
	    } else {
	    	console.error(
	    		"FLV is AVC/H.264, But your brower do not support mse!");
	    } // flvjs.isSupported
    } // makeIt

    getSize() {
        const width = this.videoTag.videoWidth > 0 ? this.videoTag.videoWidth : this.width;
        const height = this.videoTag.videoHeight > 0 ? this.videoTag.videoHeight : this.height;
        return {
            width: width,
            height: height
        };
    } // getSize


    play() {
        let _this = this;
        // if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.play();
        // } else {
        //     this.videoTag.play();
        // }
    }

    seek(pts) {
        console.log("SEEK:", pts);
        // this.play();
        // if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.currentTime = pts;
        // } else {
            // this.videoTag.currentTime = pts;
        // }
    }

    pause() {
        // if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.pause();
        // } else {
            // this.videoTag.pause();
        // }
    }

    setVoice(volume) {
        // if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.volume = volume;
        // } else {
            // this.videoTag.volume = volume;
        // }
    }

    isPlayingState() {
        // alert(!this.myPlayer.paused());
        return !this.videoTag.paused;
    }

    release() {
    	this.myPlayer.pause();
        this.myPlayer.unload();
        this.myPlayer.detachMediaElement();
        this.myPlayer.destroy();
        this.myPlayerID = null
        this.myPlayer = null;
        this.videoContaner = null;
        this.videoTag.remove();
        this.videoTag = null;
        this.onLoadFinish       = null;
        this.onPlayingTime      = null;
        this.onPlayingFinish    = null;
        // this.onSeekFinish       = null;
        this.onReadyShowDone    = null;
    }
    

} // NvFlvjsCoreModule

exports.NvFlvjsCore = NvFlvjsCoreModule;














