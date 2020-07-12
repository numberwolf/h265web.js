var MP4Box = require('mp4box'); // Or whatever import method you prefer.
var fs = require('fs');

/*
var dataTotal = '';
readStream.on('open',function(fd){
    console.log('开始读取文件');
});
readStream.on('data',function(data){
    console.log('读取到数据：');
    //console.log(data);
    dataTotal += data;
});
readStream.on('end',function(){
    console.log('文件已全部读取完毕');
    //console.log(dataTotal);
    var dataBuf = new Uint8Array(dataTotal).buffer;
    console.log(dataBuf);
    mp4Parse(dataBuf);
});
readStream.on('close',function(){
    console.log('文件被关闭');
});
readStream.on('error',function(err){
    console.log('读取文件失败');
});
*/

mp4boxfile = MP4Box.createFile();
movieInfo = null;

//const ASSET_URL = "../Movies/fmp4.mp4";
const ASSET_URL = "../Movies/veilside_fmp4.mp4";
//const ASSET_URL = "../Movies/veilside.mp4";
//var readStream = fs.createReadStream("../Movies/fmp4.mp4");

var arrayBuffer = new Uint8Array(fs.readFileSync(ASSET_URL)).buffer;
arrayBuffer.fileStart = 0;
//console.log(arrayBuffer);
mp4Parse(arrayBuffer);

function addBuffer(mp4track) {
	var track_id = mp4track.id;
    mp4boxfile.setExtractionOptions(track_id);
}

function initializeAllSourceBuffers() {
	if (movieInfo) {
		var info = movieInfo;
		for (var i = 0; i < info.tracks.length; i++) {
            console.log("addBuffer:" + i);
			var track = info.tracks[i];
			addBuffer(track);
		}
		initializeSourceBuffers();
	}
}

function onInitAppended(e) {
	var sb = e.target;
	if (sb.ms.readyState === "open") {
		sb.sampleNum = 0;
		sb.removeEventListener('updateend', onInitAppended);
		sb.addEventListener('updateend', onUpdateEnd.bind(sb, true, true));
		onUpdateEnd.call(sb, false, true);
		sb.ms.pendingInits--;
		if (sb.ms.pendingInits === 0) {
            mp4boxfile.start();
		}
	}
}

function initializeSourceBuffers() {
	var initSegs = mp4boxfile.initializeSegmentation();
	for (var i = 0; i < initSegs.length; i++) {
		var sb = initSegs[i].user;
		if (i === 0) {
			sb.ms.pendingInits = 0;
		}
		sb.addEventListener("updateend", onInitAppended);
		//Log.info("MSE - SourceBuffer #"+sb.id,"Appending initialization data");
		sb.appendBuffer(initSegs[i].buffer);
        console.log(initSegs[i].buffer);
		//saveBuffer(initSegs[i].buffer, 'track-'+initSegs[i].id+'-init.mp4');
		sb.segmentIndex = 0;
		sb.ms.pendingInits++;
	}
	//initAllButton.disabled = true;	
	//initButton.disabled = true;
}

function mp4Parse(dataStream) {
    //var mp4boxfile = MP4Box.createFile();
    mp4boxfile.onError = function(e) {
        console.log(e);
    };

    mp4boxfile.onSamples = function (id, user, samples) {
    	console.log(
            "Received " + samples.length 
            + " samples on track "+ id 
            + (user ? " for object " + user: "")
        );
        console.log(samples);
    };

/*
    mp4boxfile.onItem = function(item) {
        console.log(item.data.buffer);
    };

    mp4boxfile.onSegment = function(id, user, buffer, sampleNum, is_last) {
        console.log("mp4boxfile.onSegment");
        console.log(
            {id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last}
        );
    };
*/

    mp4boxfile.onReady = function(info) {
        console.log("1");
        //console.log(info);
        movieInfo = info;
        initializeAllSourceBuffers();
        mp4boxfile.start();
        /*
        //console.log(info.videoTracks[0].matrix);
        //console.log(info.audioTracks[0].matrix);
        //console.log(info.audioTracks);
        //console.log(info.videoTracks);
        //console.log(info.audioTracks[0].matrix);
        //console.log(info.videoTracks[0].matrix);
        //console.log(info.tracks[1]);
        //console.log(info.tracks[0]);

        console.log("============================");

        //console.log(
            //mp4boxfile.boxes[2].traks[0].mdia.minf.stbl.stsd.entries[0].boxes[1].esd.descs[0].descs[0].size,
            //mp4boxfile.boxes[2].traks[0].mdia.minf.stbl.stsd.entries[0].boxes[1].esd.descs[0].descs[0].data
        //);
        //console.log(mp4boxfile.boxes);
        console.log("==========debug============");

        //console.log(mp4boxfile.boxes);

        console.log(mp4boxfile.boxes[2]);
        console.log(mp4boxfile.boxes[3]);

        console.log("======================");
        console.log("======================");
        console.log("=========moof -> traf[index] =============");
        console.log("======================");
        console.log("======================");


        console.log(mp4boxfile.boxes[2].boxes[2]);
        */
    };
    mp4boxfile.appendBuffer(dataStream);
    //mp4boxfile.appendBuffer(data);
    //mp4boxfile.appendBuffer(data);
    mp4boxfile.flush();
}

