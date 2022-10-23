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
// const AVCommon       = require('./av-common');
const def           = require('../consts');
const VersionModule = require('../version');
const jsmpegts      = require('mpegts.js');
const AVCommon      = require('../decoder/av-common');


class NvMpegtsCoreModule {
    constructor(config) {
        this.configFormat = {
            width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            ignoreAudio: config.ignoreAudio,
            duration: config.duration,
            autoPlay: config.autoPlay || false,
            audioNone: config.audioNone
        };
        this.audioVoice = 1.0;

        this.myPlayerID = this.configFormat.playerId + '-jsmpegts';
        this.myPlayer = null;
        this.videoContaner = null;
        this.videoTag = null;

        /*
         * Attribute
         */
        this.duration       = -1;
        this.width          = -1;
        this.height         = -1;
        this.isPlaying      = false;
        this.vCodecID       = def.V_CODEC_NAME_AVC;
        this.audioNone      = false;

        this.showScreen     = false;

        this.playPTS        = 0;
        this.vCachePTS      = 0;
        this.aCachePTS      = 0;

        this.isInitDecodeFrames = false;
        this.lastDecodedFrame = 0;
        this.lastDecodedFrameTime = -1;

        this.checkStartIntervalCount = 0;
        this.checkStartInterval = null;
        this.checkPicBlockInterval = null;

        this.bufferInterval = null;
        /*
         * Event @todo
         */
        this.onPlayState        = null;
        this.onLoadFinish       = null;
        this.onPlayingTime      = null;
        this.onPlayingFinish    = null;
        // this.onSeekFinish        = null;
        this.onReadyShowDone    = null;
        this.onCacheProcess     = null;
    } // constructor

    _reBuildMpegTsjs(url) {
        alert("_reBuildMpegTsjs");
        let _this = this;
        _this._releaseMpegTsjs();
        _this.makeIt(url);
    }

    _checkPicBlock(url) {
        let _this = this;
        // _this.lastDecodedFrameTime = AVCommon.GetMsTime();
        this.checkPicBlockInterval = window.setInterval(function() {
            if (_this.lastDecodedFrameTime > 0) {
                if (AVCommon.GetMsTime() - _this.lastDecodedFrameTime > (10 * 1000)) {
                    window.clearInterval(_this.checkPicBlockInterval);
                    _this.checkPicBlockInterval = null;

                    console.log("checkPicBlockInterval _reBuildMpegTsjs");
                    _this._reBuildMpegTsjs(url);
                    return;
                }
            }
        }, 1000);
    }

    _checkLoadState(url) {
        let _this = this;
        console.log("_checkLoadState start");
        this.checkStartIntervalCount = 0;
        this.checkStartInterval = window.setInterval(function() {
            console.log(
                "_checkLoadState lastDecodedFrame", _this.lastDecodedFrame, _this.isInitDecodeFrames, 
                ' checkStartIntervalCount', _this.checkStartIntervalCount);
            if (_this.isInitDecodeFrames === false) {
                _this.checkStartIntervalCount += 1;
            } else {
                _this.checkStartIntervalCount = 0;
                window.clearInterval(_this.checkStartInterval);
                _this.checkStartInterval = null;
                return;
            }

            if (_this.checkStartIntervalCount > 20) {
                window.clearInterval(_this.checkStartInterval);
                _this.checkStartIntervalCount = 0;
                _this.checkStartInterval = null;
                if (_this.isInitDecodeFrames === false) {
                    console.log("_checkLoadState _reBuildMpegTsjs");
                    _this._reBuildMpegTsjs(url);
                }
                return;
            }
            // if (_this.lastDecodedFrame !== 0) {
            //     if (_this.lastDecodedFrame != res.decodedFrames) {
            //         _this.lastDecodedFrame = res.decodedFrames;
            //     } else {
            //         _this.lastDecodedFrame = 0;
            //         if (_this.myPlayer) {
            //             // _this.myPlayer.pause();
            //             // _this.myPlayer.unload();
            //             // _this.myPlayer.detachMediaElement();
            //             // _this.myPlayer.destroy();
            //             // _this.myPlayer = null;
            //             alert("reload jsmpegts");
            //             _this._releaseMpegTsjs();
            //             _this.makeIt(url)
            //             // _this.myPlayer = jsmpegts.createPlayer(options);
            //             // _this.myPlayer.attachMediaElement(_this.videoTag);
            //             // _this.myPlayer.load();
            //         }
            //     }
            // }
        }, 500);
    } // _checkLoadState

    makeIt(url) {
        alert("makeIt jsmpegts");

        // native
        let _this = this;
        if (jsmpegts.isSupported()) {
            console.log("jsmpegts-core jsmpegts.isSupported");
            let h265Container = document.querySelector('#' + this.configFormat.playerId);
            this.videoTag = document.createElement('video');
            this.videoTag.id = this.myPlayerID;
            this.videoTag.style.width = this.configFormat.width + 'px';
            this.videoTag.style.height = this.configFormat.height + 'px';
            h265Container.appendChild(this.videoTag);

            if (this.configFormat.autoPlay === true) {
                this.videoTag.muted = "muted";
                this.videoTag.autoplay = "autoplay";
                window.onclick = document.body.onclick = function(e) {
                    _this.videoTag.muted = false;
                    console.log("video isPlay", _this.isPlayingState());
                    window.onclick = document.body.onclick = null;
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

            // this.videoTag.onloadedmetadata = () => {
            //     alert("this.videoTag.onloadedmetadata");
            //     if (isInitDecodeFrames === false && _this.videoTag.videoWidth > 0 && _this.videoTag.videoHeight > 0) 
            //     {
            //         isInitDecodeFrames = true;
            //         _this.width = _this.videoTag.videoWidth;
            //         _this.height = _this.videoTag.videoHeight;
            //         _this.duration =  _this.videoTag.duration;
            //         alert("mpegtsduration" + _this.duration);
            //         _this.onLoadFinish && _this.onLoadFinish();
            //         _this.onReadyShowDone && _this.onReadyShowDone();

            //         _this.videoTag.ontimeupdate = () => {
            //             console.log("ontimeupdate");
            //             _this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
            //         }; // ontimeupdate
            //         if (_this.duration !== Infinity) {
            //             _this.videoTag.onended = () => {
            //                 console.log("_this.videoTag onended");
            //                 _this.onPlayingFinish && _this.onPlayingFinish();
            //             }; // onended
            //         }
            //     }
            // }; // onloadedmetadata

            // hasAudio: true,
            //     hasVideo: true,
            //     isLive: _modelAttributes.isLive,
            //     type: 'mpegts',
            //     url: _levels[_currentQuality].file,
            //     withCredentials: false
            let options = {
                hasVideo: true,
                hasAudio: !(this.configFormat.audioNone === true),
                type: 'mse',
                url: url,
                isLive: this.configFormat.duration <= 0,
                withCredentials: false
            }; // options
            console.log("jsmpegtsPlayer options", options);
            this.myPlayer = jsmpegts.createPlayer(options);
            this.myPlayer.attachMediaElement(this.videoTag);

            this.myPlayer.on(jsmpegts.Events.MEDIA_INFO, function(res) {
                console.log("Events.MEDIA_INFO", res, _this.videoTag.videoWidth);
                if (_this.isInitDecodeFrames === false)
                {
                    // _this.videoTag = h265Container.querySelector("video");
                    _this.isInitDecodeFrames = true;
                    _this.width = Math.max(_this.videoTag.videoWidth, res.width);
                    _this.height = Math.max(_this.videoTag.videoHeight, res.height);

                    if (!_this.videoTag.duration || !res.duration) {
                        _this.duration = _this.configFormat.duration / 1000.0;
                    } else {
                        if (_this.videoTag.duration) {
                            _this.duration = _this.videoTag.duration;
                        } else if (res.duration) {
                            _this.duration = res.duration;
                        }
                    }
                    
                    alert("1 mpegtsduration" + _this.duration);

                    _this.onLoadFinish && _this.onLoadFinish();
                    _this.onReadyShowDone && _this.onReadyShowDone();
                    _this._loopBufferState();
                    console.log("onReadyShowDone video isPlay", _this.isPlayingState());

                    _this.videoTag.ontimeupdate = () => {
                        console.log("_this.videoTag ontimeupdate");
                        _this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
                    }; // ontimeupdate
                    if (_this.duration !== Infinity && _this.duration > 0) {
                        _this.videoTag.onended = () => {
                            console.log("_this.videoTag onended");
                            _this.onPlayingFinish && _this.onPlayingFinish();
                        }; // onended
                    }
                    // check
                    // _this.lastDecodedFrame = 1;
                    // _this.lastDecodedFrameTime = AVCommon.GetMsTime();
                }
            });
            // this.myPlayer.on(jsmpegts.Events.STATISTICS_INFO, function(res) {
            //     console.log("Events.STATISTICS_INFO", 
            //         res, 
            //         _this.videoTag.videoWidth, _this.videoTag.videoHeight,
            //         _this.videoTag.duration);
            //     if (_this.isInitDecodeFrames === false &&
            //         _this.videoTag.videoWidth > 0 &&
            //         _this.videoTag.videoHeight > 0)
            //     {
            //         _this.isInitDecodeFrames = true;
            //         _this.width = _this.videoTag.videoWidth;
            //         _this.height = _this.videoTag.videoHeight;
            //         _this.duration =  _this.videoTag.duration;
            //         alert("1 mpegtsduration" + _this.duration);
            //         _this.onLoadFinish && _this.onLoadFinish();
            //         _this.onReadyShowDone && _this.onReadyShowDone();
            //         _this._loopBufferState();
            //         console.log("onReadyShowDone video isPlay", _this.isPlayingState());

            //         _this.videoTag.ontimeupdate = () => {
            //             console.log("_this.videoTag ontimeupdate");
            //             _this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
            //         }; // ontimeupdate
            //         if (_this.duration !== Infinity) {
            //             _this.videoTag.onended = () => {
            //                 console.log("_this.videoTag onended");
            //                 _this.onPlayingFinish && _this.onPlayingFinish();
            //             }; // onended
            //         }
            //     }

            //     // check
            //     _this.lastDecodedFrame = res.decodedFrames;
            //     _this.lastDecodedFrameTime = AVCommon.GetMsTime();
            // });
            this.myPlayer.on(jsmpegts.Events.SCRIPTDATA_ARRIVED, function(res) {
                console.log("Events.SCRIPTDATA_ARRIVED", res);
            });
            // this.myPlayer.on(jsmpegts.Events.METADATA_ARRIVED, function(res) {
            //     alert("1 METADATA_ARRIVED");
            //     if (_this.isInitDecodeFrames === false && res.width && res.width > 0) 
            //     {
            //         _this.isInitDecodeFrames = true;
            //         alert("2 METADATA_ARRIVED");
            //         console.log("Events.METADATA_ARRIVED", res);
            //         _this.duration = res.duration;
            //         _this.width = res.width;
            //         _this.height = res.height;
            //         alert("2 mpegtsduration" + _this.duration);
            //         _this.onLoadFinish && _this.onLoadFinish();
            //         _this.onReadyShowDone && _this.onReadyShowDone();
            //         _this._loopBufferState();
            //         console.log("onReadyShowDone video isPlay", _this.isPlayingState());

            //         _this.videoTag.ontimeupdate = () => {
            //             console.log("_this.videoTag ontimeupdate");
            //             _this.onPlayingTime && _this.onPlayingTime(_this.videoTag.currentTime);
            //         }; // ontimeupdate
            //         if (_this.duration !== Infinity) {
            //             _this.videoTag.onended = () => {
            //                 console.log("_this.videoTag onended");
            //                 _this.onPlayingFinish && _this.onPlayingFinish();
            //             }; // onended
            //         }
            //     }
            // }); // METADATA_ARRIVED
            this.myPlayer.on(jsmpegts.Events.ERROR, function(errorType, errorDetail, errorInfo) {
                console.log("Events.ERROR", errorType, errorDetail, errorInfo);
                // 视频出错后销毁重新创建
                if (_this.myPlayer) {
                    console.log("jsmpegts.Events.ERROR _reBuildMpegTsjs");
                    _this._reBuildMpegTsjs(url);
                }
            });
            
            this.myPlayer.load();
            this._checkLoadState(url);
            this._checkPicBlock(url);
        } else {
            console.error(
                "FLV is AVC/H.264, But your brower do not support mse!");
        } // jsmpegts.isSupported
    } // makeIt

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
        const width = this.videoTag.videoWidth > 0 ? this.videoTag.videoWidth : this.width;
        const height = this.videoTag.videoHeight > 0 ? this.videoTag.videoHeight : this.height;
        return {
            width: width,
            height: height
        };
    } // getSize


    play() {
        let _this = this;
        console.log("ts play", this.videoTag);
        // if (this.videoTag === undefined || this.videoTag === null) {
            // this.myPlayer.play();
        // } else {
            this.videoTag.play();
        // }
    }

    seek(pts) {
        console.log("SEEK:", pts);
        // this.play();
        // if (this.videoTag === undefined || this.videoTag === null) {
            // this.myPlayer.currentTime = pts;
        // } else {
            this.videoTag.currentTime = pts;
        // }
    }

    pause() {
        // if (this.videoTag === undefined || this.videoTag === null) {
            // this.myPlayer.pause();
        // } else {
            this.videoTag.pause();
        // }
    }

    setVoice(volume) {
        // if (this.videoTag === undefined || this.videoTag === null) {
            // this.myPlayer.volume = volume;
        // } else {
            this.videoTag.volume = volume;
        // }
    }

    isPlayingState() {
        // alert(!this.myPlayer.paused());
        return !this.videoTag.paused;
    }

    _loopBufferState() {
        let _this = this;
        if (_this.duration <= 0 && _this.videoTag.duration) {
            _this.duration = _this.videoTag.duration;
        }

        if (_this.bufferInterval !== null) {
            window.clearInterval(_this.bufferInterval);
            _this.bufferInterval = null;
        }

        _this.bufferInterval = window.setInterval(function() {
            if (_this.configFormat.duration <= 0) {
                window.clearInterval(_this.bufferInterval);
                return;
            }

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

    _releaseMpegTsjs() {
        console.log(this.myPlayer);
        this.myPlayer.pause();
        this.myPlayer.unload();
        this.myPlayer.detachMediaElement();
        this.myPlayer.destroy();
        this.myPlayer = null;
        this.videoTag.remove();
        this.videoTag = null;

        if (this.checkStartInterval !== null) {
            this.checkStartIntervalCount = 0;
            window.clearInterval(this.checkStartInterval);
            this.checkStartInterval = null;
        }
        if (this.checkPicBlockInterval !== null) {
            window.clearInterval(this.checkPicBlockInterval);
            this.checkPicBlockInterval = null;
        }

        this.isInitDecodeFrames = false;
        this.lastDecodedFrame = 0;
        this.lastDecodedFrameTime = -1;

        alert("release mpegts-hevc js");
    }

    release() {
        if (this.checkStartInterval !== null) {
            this.checkStartIntervalCount = 0;
            window.clearInterval(this.checkStartInterval);
            this.checkStartInterval = null;
        }
        if (this.checkPicBlockInterval !== null) {
            window.clearInterval(this.checkPicBlockInterval);
            this.checkPicBlockInterval = null;
        }
        if (this.bufferInterval !== null) {
            window.clearInterval(this.bufferInterval);
            this.bufferInterval = null;
        }
        this._releaseMpegTsjs();

        this.myPlayerID = null;
        this.videoContaner = null;
        
        this.onLoadFinish       = null;
        this.onPlayingTime      = null;
        this.onPlayingFinish    = null;
        // this.onSeekFinish       = null;
        this.onReadyShowDone    = null;
        this.onPlayState        = null;

        window.onclick = document.body.onclick = null;
    }
    

} // NvMpegtsCoreModule

exports.NvMpegTsCore = NvMpegtsCoreModule;














