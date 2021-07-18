import H265webjsModule from './dist/index';
import RawParserModule from './dist/raw-parser.js';

const SHOW_LOADING = "loading...";
const SHOW_DONE = "done.";

function durationFormatSubVal(val) {
    let valStr = val.toString();
    if (valStr.length < 2) {
        return '0' + valStr;
    }
    return valStr;
}

function durationText(duration) {
    if (duration < 0) {
        return "Play";
    }
    let durationSecInt = Math.round(duration);
    return durationFormatSubVal(Math.floor(durationSecInt / 3600))
    + ":" + durationFormatSubVal(Math.floor((durationSecInt % 3600) / 60))
    + ":" + durationFormatSubVal(Math.floor(durationSecInt % 60));
}

const getMsTime = () => {
    return new Date().getTime();
};

/*************************************************
 *
 *
 *               Build Player
 *
 *
 **************************************************/
// clear cache count
H265webjsModule.clear();
global.makeH265webjs = (videoURL, config) => {
    let playerId        = config.player;

    let playerObj       = H265webjsModule.createPlayer(videoURL, config);

    let playerDom       = document.querySelector('#' + playerId);
    let playerCont      = document.querySelector('#player-container');
    let controllerCont  = document.querySelector('#controller');
    let progressCont    = document.querySelector('#progress-contaniner');
    let progressContW   = progressCont.offsetWidth;
    let cachePts        = progressCont.querySelector('#cachePts');
    let progressPts     = progressCont.querySelector('#progressPts');
    let progressVoice   = document.querySelector('#progressVoice');
    let playBar         = document.querySelector('#playBar');
    let playBtn         = playBar.getElementsByTagName('a')[0];
    let showLabel       = document.querySelector('#showLabel');
    let ptsLabel        = document.querySelector('#ptsLabel');
    let coverToast      = document.querySelector('#coverLayer');
    let coverBtn        = document.querySelector('#coverLayerBtn');
    let muteBtn         = document.querySelector('#muteBtn');
    // let debugYUVBtn     = document.querySelector('#debugYUVBtn');
    // let debugYUVATag    = document.querySelector('#debugYUVUrl');
    let fullScreenBtn   = document.querySelector('#fullScreenBtn');
    let mediaInfo       = null;

    playBtn.disabled    = true;
    // playBar.textContent = '>';
    showLabel.textContent = SHOW_LOADING;
    playerCont.style.width = config.width + 'px';
    playerCont.style.height = config.height + 'px';
    controllerCont.style.width = config.width + 'px';

    let muteState = false;

    // controllerCont.style.left = playerContainer.clientLeft;
    // controllerCont.style.bottom = playerContainer.clientBottom;
    // alert(playerContainer.clientLeft);

    let playAction = () => {
        console.log("is playing:", playerObj.isPlaying());
        if (playerObj.isPlaying()) {
            console.log("bar pause============>");
            // playBar.textContent = '>';
            playBar.setAttribute('class', 'playBtn');
            playerObj.pause();
        } else {
            // playBar.textContent = '||';
            playBar.setAttribute('class', 'pauseBtn');
            playerObj.play();
        }
    };

    playerCont.onmouseover = function() {
        controllerCont.hidden = false;
    };

    playerCont.onmouseout = function() {
        controllerCont.hidden = true;
    };

    playerDom.onmouseup = function() {
        playAction();
    };

    playBtn.onclick = () => {
        playAction();
    };

    muteBtn.onclick = () => {
        console.log(playerObj.getVolume());
        if (muteState === true) {
            playerObj.setVoice(1.0);
            progressVoice.value = 100;
        } else {
            playerObj.setVoice(0.0);
            progressVoice.value = 0;
        }
        muteState = !muteState;
    };

    fullScreenBtn.onclick = () => {
        playerObj.fullScreen();
        // setTimeout(() => {
        //     playerObj.closeFullScreen();
        // }, 2000);
    };

    progressCont.addEventListener('click', (e) => {
        showLabel.textContent = SHOW_LOADING;
        let x = e.pageX - progressCont.getBoundingClientRect().left; // or e.offsetX (less support, though)
        let y = e.pageY - progressCont.getBoundingClientRect().top;  // or e.offsetY
        let clickedValue = x * progressCont.max / progressCont.offsetWidth;
        // alert(clickedValue);
        playerObj.seek(clickedValue);
    });

    progressVoice.addEventListener('click', (e) => {
        let x = e.pageX - progressVoice.getBoundingClientRect().left; // or e.offsetX (less support, though)
        let y = e.pageY - progressVoice.getBoundingClientRect().top;  // or e.offsetY
        let clickedValue = x * progressVoice.max / progressVoice.offsetWidth;
        progressVoice.value = clickedValue;
        let volume = clickedValue / 100;
        // alert(volume);
        // console.log(
        //     progressVoice.offsetLeft, // 209
        //     x, y, // 324 584
        //     progressVoice.max, progressVoice.offsetWidth);
        playerObj.setVoice(volume);
    });

    playerObj.onSeekStart = (pts) => {
        showLabel.textContent = SHOW_LOADING + " seek to:" + parseInt(pts);
    };

    playerObj.onSeekFinish = () => {
        showLabel.textContent = SHOW_DONE;
    };

    playerObj.onPlayFinish = () => {
        console.log("============= FINISHED ===============");
        // playBar.textContent = '>';
        playBar.setAttribute('class', 'playBtn');
        // playerObj.release();
        // console.log("=========> release ok");
    };

    playerObj.onRender = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        console.log("on render");
    };

    playerObj.onOpenFullScreen = () => {
        console.log("onOpenFullScreen");
    };

    playerObj.onCloseFullScreen = () => {
        console.log("onCloseFullScreen");
    };

    playerObj.onSeekFinish = () => {
        showLabel.textContent = SHOW_DONE;
    };

    playerObj.onLoadCache = () => {
        showLabel.textContent = "Caching...";
    };

    playerObj.onLoadCacheFinshed = () => {
        showLabel.textContent = SHOW_DONE;
    };

    playerObj.onReadyShowDone = () => {
        console.log("onReadyShowDone");
        showLabel.textContent = "Cover Img OK";
    };

    playerObj.onLoadFinish = () => {
        playerObj.setVoice(1.0);
        mediaInfo = playerObj.mediaInfo();
        console.log("mediaInfo===========>", mediaInfo);
        /*
        meta:
            durationMs: 144400
            fps: 25
            sampleRate: 44100
            size: {
                width: 864,
                height: 480
            },
            audioNone : false
        videoType: "vod"
        */
        playBtn.disabled = false;

        if (mediaInfo.meta.audioNone) {
            progressVoice.value = 0;
            progressVoice.style.display = 'none';
        } else {
            playerObj.setVoice(0.5);
        }

        if (mediaInfo.videoType == "vod") {
            cachePts.max = mediaInfo.meta.durationMs / 1000;
            progressCont.max = mediaInfo.meta.durationMs / 1000;
            ptsLabel.textContent = durationText(0) + '/' + durationText(progressCont.max);
        } else {
            cachePts.hidden = true;
            progressCont.hidden = true;
            ptsLabel.textContent = 'LIVE';

            if (mediaInfo.meta.audioNone === true) {
                playBar.textContent = '||';
                playerObj.play();
            } else {

                coverToast.removeAttribute('hidden');
                coverBtn.onclick = () => {
                    playBar.textContent = '||';
                    playerObj.play();
                    coverToast.setAttribute('hidden', 'hidden');
                };
            }

        }

        showLabel.textContent = SHOW_DONE;
    };

    playerObj.onCacheProcess = (cPts) => {
        // console.log("onCacheProcess => ", cPts);
        try {
            // cachePts.value = cPts;
            let precent = cPts / progressCont.max;
            let cacheWidth = precent * progressContW;
            // console.log(precent, precent * progressCont.offsetWidth);
            cachePts.style.width = cacheWidth + 'px';
        } catch(err) {
            console.log(err);
        }
    };

    playerObj.onPlayTime = (videoPTS) => {
        if (mediaInfo.videoType == "vod") {
            // progressPts.value = videoPTS;
            let precent = videoPTS / progressCont.max;
            let progWidth = precent * progressContW;
            // console.log(precent, precent * progressCont.offsetWidth);
            progressPts.style.width = progWidth + 'px';

            ptsLabel.textContent = durationText(videoPTS) + '/' + durationText(progressCont.max);
        } else {
            // ptsLabel.textContent = durationText(videoPTS) + '/LIVE';
            ptsLabel.textContent = '/LIVE';
        }
    };

    playerObj.do();
    return playerObj;
};

/*
 * 创建265流播放器
 */
global.makeH265webjsRaw = (url265, config) => {
    let screenView = new ScreenModule.Screen();
    let h265webjs       = H265webjsModule.createPlayer(null, config);

    let progressPts     = document.querySelector('#progressPts');
    let progressVoice   = document.querySelector('#progressVoice');
    let playBar         = document.querySelector('#playBtn');
    let fullScreenBtn   = document.querySelector('#fullScreenBtn');
    let mediaInfo       = null;

    playBar.disabled    = true;
    playBar.textContent = '>';

    playBar.onclick = () => {
        if (h265webjs.isPlaying()) {
            console.log("bar pause============>");
            playBar.textContent = '>';
            h265webjs.pause();
        } else {
            playBar.textContent = '||';
            h265webjs.play();
        }
    };

    fullScreenBtn.onclick = () => {
        screenView.open();
        h265webjs.setRenderScreen(true);
    };

    screenView.onClose = () => {
        h265webjs.setRenderScreen(false);
    };

    h265webjs.onRender = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        screenView.render(width, height, imageBufferY, imageBufferB, imageBufferR);
        console.log("on render");
    };

    h265webjs.onPlayTime = (videoPTS) => {
        if (mediaInfo.videoType == "vod") {
            progressPts.value = videoPTS;
            ptsLabel.textContent = durationText(videoPTS) + '/' + durationText(progressPts.max);
        } else {
            ptsLabel.textContent = durationText(videoPTS) + '/LIVE';
        }
    };

    h265webjs.onLoadFinish = () => {
        /*
         * fetch 265
         * you can use your code to fetch vod stream
         * only need `h265webjs.append265NaluFrame(nalBuf);` to append 265 frame
         */
        let rawParser = new RawParserModule();

        /*
         * fetch 265
         */
        let fetchFinished = false;
        let startFetch = false;
        let networkInterval = window.setInterval(() => {
            if (!startFetch) {
                startFetch = true;
                fetch(url265).then(function(response) {
                    let pump = function(reader) {
                        return reader.read().then(function(result) {
                            if (result.done) {
                                // console.log("========== RESULT DONE ===========");
                                fetchFinished = true;
                                window.clearInterval(networkInterval);
                                networkInterval = null;
                                return;
                            }

                            let chunk = result.value;
                            rawParser.appendStreamRet(chunk);
                            return pump(reader);
                        });
                    }
                    return pump(response.body.getReader());
                })
                .catch(function(error) {
                    console.log(error);
                });
            }
        }, 1);

        // fps>=30 play else cache
        let naluParseInterval = window.setInterval(() => {
            let test1time = getMsTime();
            let nalBuf = rawParser.nextNalu(); // nal
            let preCostTime = getMsTime() - test1time;
            console.log("rawParser.nextNalu() => ", nalBuf, " usage => ",preCostTime);

            if (nalBuf != false) {
                // require
                h265webjs.append265NaluFrame(nalBuf);
            } else if (fetchFinished) {
                window.clearInterval(naluParseInterval);
                naluParseInterval = null;
            }

        }, 1);


        h265webjs.setVoice(0.0);
        mediaInfo = h265webjs.mediaInfo();
        console.log("mediaInfo===========>", mediaInfo);
        /*
        meta:
            durationMs: 144400
            fps: 25
            sampleRate: 44100
            size: {
                width: 864,
                height: 480
            },
            audioNone : false
        videoType: "vod"
        */
        playBar.disabled = false;

        if (mediaInfo.meta.audioNone) {
            progressVoice.value = 0;
            progressVoice.style.display = 'none';
        }

        if (mediaInfo.videoType == "vod") {
            progressPts.max = mediaInfo.meta.durationMs / 1000;
            ptsLabel.textContent = '0:0:0/' + durationText(progressPts.max);
        } else {
            progressPts.hidden = true;
            ptsLabel.textContent = '0:0:0/LIVE';
        }
        showLabel.textContent = SHOW_DONE;
    };

    h265webjs.do();
    return h265webjs;
};













