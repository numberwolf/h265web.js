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
const videojs 		= require('video.js');

class NvVideojsCoreModule {
	constructor(config) {
		this.configFormat = {
			width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            ignoreAudio: config.ignoreAudio
        };
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
		this.vCachePTS		= 0;
		this.aCachePTS		= 0;

        /*
         * Event @todo
         */
        this.onMakeItReady      = null;
        this.onLoadFinish       = null;
        this.onPlayingTime 		= null;
        this.onPlayingFinish 	= null;
        this.onSeekFinish 		= null;
        this.onReadyShowDone    = null;
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
        this.videoTag = this.videoContaner.querySelector("video");
        this.videoTag.style.width = this.configFormat.width + 'px';
        this.videoTag.style.height = this.configFormat.height + 'px';

        console.log("this.videoTag==>", this.videoTag);

        this.duration = this.myPlayer.duration();
        alert("duration:" + this.duration === Infinity);

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
            autoplay : false,
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

        let h265Container = document.querySelector('#' + this.configFormat.playerId);
        let proVjsDom = document.createElement('video');
        proVjsDom.id = this.myPlayerID;
        h265Container.appendChild(proVjsDom);

        this.myPlayer = videojs(this.myPlayerID, options, function() {
            alert("load vjs");
            _this.myPlayer.on("canplaythrough", function() {
                console.log("视频源数据加载完成");
            });
            //myPlayer.play();
            _this.myPlayer.on("loadedmetadata", function() {
                console.log("vjs loadedmetadata");
                _this._onVideoJsReady();
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
            _this.onLoadFinish && _this.onLoadFinish();
            _this.onReadyShowDone && _this.onReadyShowDone();
        });
        this.myPlayer.options.controls = false;
        // this.myPlayer.options.autoplay = 'any';
        this.myPlayer.options.autoplay = false;
        this._hiddenUnusedPlugins();
    } // makeIt

    getSize() {
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

    release() {
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
    }
    

} // NvVideojsCoreModule

exports.NvVideojsCore = NvVideojsCoreModule;














