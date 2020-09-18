const H265webjs = require('./dist/h265webjs');
const ScreenModule = require('./screen');

const SHOW_LOADING = "LOADING...!";
const SHOW_DONE = "done.";

global.makeH265webjs = (videoURL, config) => {
    screenView = new ScreenModule.Screen();

    durationText = duration => {
        if (duration < 0) {
            return "Play";
        }
        let durationSecInt = Math.round(duration);
        return Math.floor(durationSecInt / 3600)
        + ":" + Math.floor((durationSecInt % 3600) / 60)
        + ":" + Math.floor(durationSecInt % 60);
    };

    let h265webjs       = new265webjs(videoURL, config);
    let progressPts     = document.querySelector('#progressPts');
    let progressVoice   = document.querySelector('#progressVoice');
    let playBar         = document.querySelector('#playBtn');
    let showLabel       = document.querySelector('#showLabel');
    let ptsLabel        = document.querySelector('#ptsLabel');
    let fullScreenBtn   = document.querySelector('#fullScreenBtn');
    let mediaInfo       = null;

    playBar.disabled    = true;
    playBar.textContent = '>';

    showLabel.textContent = SHOW_LOADING;

    playBar.onclick = () => {
        if (h265webjs.isPlaying()) {
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

    progressPts.addEventListener('click', (e) => {
        showLabel.textContent = SHOW_LOADING;
        let x = e.pageX - progressPts.offsetLeft; // or e.offsetX (less support, though)
        let y = e.pageY - progressPts.offsetTop;  // or e.offsetY
        let clickedValue = x * progressPts.max / progressPts.offsetWidth;
        h265webjs.seek(clickedValue);
    });

    progressVoice.addEventListener('click', (e) => {
        let x = e.pageX - progressVoice.offsetLeft; // or e.offsetX (less support, though)
        let y = e.pageY - progressVoice.offsetTop;  // or e.offsetY
        let clickedValue = x * progressVoice.max / progressVoice.offsetWidth;
        progressVoice.value = clickedValue;
        let volume = clickedValue / 100;
        h265webjs.setVoice(volume);
    });

    h265webjs.onSeekFinish = () => {
        showLabel.textContent = SHOW_DONE;
    };

    h265webjs.onRender = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
        screenView.render(width, height, imageBufferY, imageBufferB, imageBufferR);
        console.log("on render");
    };

    h265webjs.onMaskClick = () => {
        if (h265webjs.isPlaying()) {
            playBar.textContent = '||';
        } else {
            playBar.textContent = '>';
        }
    };

    h265webjs.onLoadFinish = () => {
        h265webjs.setVoice(1.0);
        mediaInfo = h265webjs.mediaInfo();
        console.log(mediaInfo);
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

    h265webjs.onPlayTime = (videoPTS) => {
        if (mediaInfo.videoType == "vod") {
            progressPts.value = videoPTS;
            ptsLabel.textContent = durationText(videoPTS) + '/' + durationText(progressPts.max);
        } else {
            ptsLabel.textContent = durationText(videoPTS) + '/LIVE';
        }
    };

    h265webjs.do();
    return h265webjs;
}
