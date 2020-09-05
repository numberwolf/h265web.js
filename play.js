const H265webjs = require('./h265webjs');
const M3U8 = require('./demuxer/m3u8');
const MPEG_JS = require('mpeg.js');

global.makeH265webjs = (videoURL, config) => {
    let h265webjs = new H265webjs.H265webjs(videoURL, config);
    return h265webjs;
}

global.makeTestHLS = () => {
	let hls = new M3U8.M3u8();
	let mpegTsObj = new MPEG_JS.MPEG_JS({});

	let tsList = [];
	let vStartTime = 0;
	let aStartTime = 0;
	let lockWait = {
		state : false,
		lockMember : {
			dur : 0
		}
	};

	hls.onTransportStream = (streamURI, streamDur) => {
		console.log("Event onTransportStream ===> ", streamURI, streamDur);
		// demuxURL(streamURI);
		tsList.push({
			streamURI : streamURI,
			streamDur : streamDur
		});
	};

	mpegTsObj.onDemuxed = () => {
		let mediaInfo = mpegTsObj.readMediaInfo();
		let extensionInfo = mpegTsObj.readExtensionInfo();

		console.log("DURATION===>" + mediaInfo.duration);

        while(1) {
            let readData = mpegTsObj.readPacket();
            if (readData.size <= 0) {
                break;
            }
            let pts = readData.dtime;
            if (readData.type == 0) {
            	console.log("vStartTime:" + vStartTime);
            	console.log(pts + vStartTime);
            } else {
            	// console.log(pts + aStartTime);
            }
        }
        // vStartTime += mediaInfo.vDuration;
        // aStartTime += mediaInfo.aDuration;
        console.log(lockWait.lockMember.dur);
        vStartTime += parseFloat(lockWait.lockMember.dur);
        aStartTime += parseFloat(lockWait.lockMember.dur);
        console.log("vStartTime:" + vStartTime);
        lockWait.state = false;
    };


	mpegTsObj.onReady = () => {
        console.log("onReady");
        /*
         * start
         */
        // fetch(videoURL).then(res => res.arrayBuffer()).then(streamBuffer => {
        //     streamBuffer.fileStart = 0;
        //     // array buffer to unit8array
        //     let streamUint8Buf = new Uint8Array(streamBuffer);
        //     // console.log(streamUint8Buf);
        //     mpegTsObj.demux(streamUint8Buf);
        // });

        // run
        // /res/hls/veilside.m3u8
		hls.fetchM3u8("http://ivi.bupt.edu.cn/hls/cctv1hd.m3u8");
		// hls.fetchM3u8("/res/hls/veilside.m3u8");
    };

    mpegTsObj.initDemuxer();

    let timerFeed = window.setInterval(() => {
    	if (tsList.length > 0 && lockWait.state == false) {
    		let item = tsList.shift();
    		let itemURI = item.streamURI;
    		let itemDur = item.streamDur;

    		console.log("Vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv> ENTRY " + itemURI);
    		lockWait.state = true;
    		lockWait.lockMember.dur = itemDur;
    		mpegTsObj.demuxURL(itemURI);
    		console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^> NEXT ");
    	}
    }, 50);

	
}