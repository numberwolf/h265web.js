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
// const AVCommon 		= require('./av-common');
const def 			= require('../consts');
const VersionModule = require('../version');
const videojs 		= require('video.js');

class NvVideojsCoreModule {
	constructor(config) {
		this.configFormat = {
            probeDurationMS: config.probeDurationMS,
			width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            ignoreAudio: config.ignoreAudio,
            autoPlay: config.autoPlay || false,
        };
        console.log("this.configFormat", this.configFormat);
        this.audioVoice	= 1.0;

        this.myPlayerID = this.configFormat.playerId + '-vjs';
        this.myPlayer = null;
        this.videoContaner = null;
        this.videoTag = null;

        /*
		 * Attribute
		 */
		this.duration		= -1;
		this.vCodecID 		= def.V_CODEC_NAME_AVC;
		this.audioNone		= false;

		this.showScreen		= false;

		this.playPTS		= 0;
		// this.vCachePTS		= 0;
		// this.aCachePTS		= 0;

        this.loadSuccess    = false;

        this.bufferInterval = null;
        this.bootInterval = null;

        /*
         * Event
         */
        this.onMakeItReady      = null;
        this.onLoadFinish       = null;
        this.onPlayingTime 		= null;
        this.onPlayingFinish 	= null;
        this.onSeekFinish 		= null;
        this.onReadyShowDone    = null;
        this.onPlayState        = null;
        this.onCacheProcess     = null;
    } // constructor

    _hiddenUnusedPlugins() {
        this._hiddenUnused("vjs-loading-spinner");
        this._hiddenUnused("vjs-hidden");
        this._hiddenUnused("vjs-control-bar");
        this._hiddenUnused("vjs-control");
        this._hiddenUnused("vjs-text-track-display");
        this._hiddenUnused("vjs-big-play-button");
    } // _hiddenUnusedPlugins

    _hiddenUnused(className) {
        Array.from(
            document.getElementsByClassName(className)
        ).forEach(it =>
            {
                if(status){
                    it && it.setAttribute('style', "display: block;");
                } else {
                    it && it.setAttribute('style', "display: none;");
                }
            }
        ); // end remove loading
    } // _hiddenUnused

    _onVideoJsReady() {
        let _this = this;
        this._hiddenUnusedPlugins();
        this.videoContaner = document.querySelector('#' + this.myPlayerID);
        // this.videoTag = this.videoContaner.querySelector("video");
        this.videoTag.style.width = this.configFormat.width + 'px';
        this.videoTag.style.height = this.configFormat.height + 'px';

        this.duration = this.myPlayer.duration();
        console.log("this.videoTag==>", this.videoTag, this.duration, this.getSize(), this.videoTag.videoWidth);

        // this.onLoadFinish && this.onLoadFinish();
        // this.onReadyShowDone && this.onReadyShowDone();

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
        let options = {
            techOrder: ['html5'],
            width: this.configFormat.width,
            height: this.configFormat.height,
            controls : false,
            //children : [],
            bigPlayButton : false,
            textTrackDisplay : false,
            posterImage: true,
            errorDisplay : false,
            controlBar : false,
            preload : 'auto',
            // autoplay : 'any',
            autoplay : this.configFormat.autoPlay,
            sources: [
                {
                    src: url,
                    // src: 'res/hls2/test.m3u8',
                    //src: 'https://hls.cntv.lxdns.com/asp/hls/2000/0303000a/3/default/90b9b0a51ed6428986603865a7566777/2000.m3u8',
                    //src: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8',
                    //src: 'http://182.61.31.119:8080/live/livestream.m3u8',
                    type: 'application/x-mpegURL'
                }
            ]
        };

        console.log("vjs module makeIt", options);

        let h265Container = document.querySelector('#' + this.configFormat.playerId);
        let proVjsDom = document.createElement('video');
        proVjsDom.id = this.myPlayerID;

        this.videoTag = proVjsDom;
        h265Container.appendChild(proVjsDom);

        if (this.configFormat.autoPlay === true) {
            this.videoTag.muted = "muted";
            this.videoTag.autoplay = "autoplay";
            window.onclick = document.body.onclick = function(e) {
                _this.videoTag.muted = false;
                console.log("video isPlay", _this.isPlayingState());
                window.onclick = document.body.onclick = null;
            };
        }

        console.log("vjs this.videoTag", this.videoTag);

		//this.videoTag.onloadedmetadata = (e) => {
			//console.log("vjs this.videoTag loadedmetadata", e);
        //};

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

        this.myPlayer = videojs(this.myPlayerID, options, function() {
            alert("load vjs");
            _this.myPlayer.on("canplaythrough", function() {
                console.log("视频源数据加载完成", 
                    _this.getSize(), _this.videoTag.videoWidth);
                // if (_this.configFormat.probeDurationMS > 0) {
                //     _this.onLoadFinish && _this.onLoadFinish();
                //     _this.onReadyShowDone && _this.onReadyShowDone();
                // }
            });
            //myPlayer.play();
            _this.myPlayer.on("loadedmetadata", function(e) {
                console.log("vjs loadedmetadata", e);
                _this._onVideoJsReady();
                if (_this.configFormat.probeDurationMS >= 0) {
                    _this.onLoadFinish && _this.onLoadFinish();
                    _this.onReadyShowDone && _this.onReadyShowDone();
                    _this._loopBufferState();
                    _this.loadSuccess = true;
                }
            });
            _this.myPlayer.on("ended", function() {
                _this.pause();
                _this.onPlayingFinish && _this.onPlayingFinish();
            });
            _this.myPlayer.on("seeking", function() {
                console.log("seeking...");
            });
            _this.myPlayer.on("seeked", function() {
                console.log("seeked!");
                _this.onSeekFinish && _this.onSeekFinish();
            });
            // _this.play();
            _this.onMakeItReady && _this.onMakeItReady();
            if (_this.configFormat.probeDurationMS < 0) {
                _this.onLoadFinish && _this.onLoadFinish();
                _this.onReadyShowDone && _this.onReadyShowDone();
                _this._loopBufferState();
                _this.loadSuccess = true;
            }
        });
        this.myPlayer.options.controls = false;
        // this.myPlayer.options.autoplay = 'any';
        this.myPlayer.options.autoplay = false;
        this._hiddenUnusedPlugins();
        
        /*if (this.onMakeItReady === undefined || this.onMakeItReady === null) {
            if (this.bootInterval !== undefined && this.bootInterval !== null) {
                window.clearInterval(this.bootInterval);
                this.bootInterval = null;
            }
            let checkOnLoadCountMAX = 3;
            this.bootInterval = window.setInterval(function() {
                if (_this.loadSuccess === true) {
                    window.clearInterval(_this.bootInterval);
                    _this.bootInterval = null;
                    return;
                }
                //_this.videoTag = document.getElementById(_this.myPlayerID).querySelector("video");
                checkOnLoadCountMAX--;
                console.log("checkOnLoadCountMAX:", checkOnLoadCountMAX);

                if (checkOnLoadCountMAX <= 0) {
                    window.clearInterval(_this.bootInterval);
                    _this.bootInterval = null;

                    _this.onLoadFinish && _this.onLoadFinish();
                    _this.onReadyShowDone && _this.onReadyShowDone();
                    _this._loopBufferState();
                    _this.loadSuccess = true;
                    return;
                }
            }, 1000); // bootInterval
        }*/

    } // makeIt

    _refreshVideoTagEvent() {
        let _this = this;
        _this.videoTag = document.getElementById(_this.myPlayerID).querySelector("video");
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
        if (this.myPlayer.videoWidth() <= 0) {
            return {
                width: this.videoTag.videoWidth,
                height: this.videoTag.videoHeight
            };
        }
        return {
            width: this.myPlayer.videoWidth(),
            height: this.myPlayer.videoHeight(),
        };
    } // getSize


    play() {
        let _this = this;
        if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.play();
        } else {
            this.videoTag.play();
        }
    }

    seek(pts) {
        console.log("SEEK:", pts);
        // this.play();
        if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.currentTime = pts;
        } else {
            this.videoTag.currentTime = pts;
        }
    }

    pause() {
        if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.pause();
        } else {
            this.videoTag.pause();
        }
    }

    setVoice(volume) {
        if (this.videoTag === undefined || this.videoTag === null) {
            this.myPlayer.volume = volume;
        } else {
            this.videoTag.volume = volume;
        }
    }

    isPlayingState() {
        // alert(!this.myPlayer.paused());
        return !this.myPlayer.paused();
    }

    _loopBufferState() {
        let _this = this;
        if (_this.duration <= 0) {
            _this.duration = _this.videoTag.duration;
        }

        if (_this.bufferInterval !== null) {
            window.clearInterval(_this.bufferInterval);
            _this.bufferInterval = null;
        }

        alert("probeDurationMS:" + _this.configFormat.probeDurationMS);
        if (_this.configFormat.probeDurationMS <= 0 || _this.duration <= 0) {
            return;
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
    }

    release() {
        this.loadSuccess = false;
        if (this.bootInterval !== undefined && this.bootInterval !== null) {
            window.clearInterval(this.bootInterval);
            this.bootInterval = null;
        }
        this.myPlayer.dispose();
        this.myPlayerID = null
        this.myPlayer = null;
        this.videoContaner = null;
        this.videoTag = null;
        this.onLoadFinish       = null;
        this.onPlayingTime      = null;
        this.onPlayingFinish    = null;
        this.onSeekFinish       = null;
        this.onReadyShowDone    = null;
        this.onPlayState        = null;

        if (this.bufferInterval !== null) {
            window.clearInterval(this.bufferInterval);
            this.bufferInterval = null;
        }

        window.onclick = document.body.onclick = null;
    }
    

} // NvVideojsCoreModule

exports.NvVideojsCore = NvVideojsCoreModule;














