var mp4Obj      = InitMp4Parser();
var player      = null;
var playerStatus= false;
var timeLoop    = null;
var isStart     = false;
var submitStart = false;

// websocket
var ws = null;

function recvData() {
    // ws.send(PLAY_CMD);
};

function getLiveWS (ip, port, callback) {
    // ws = new WebSocket("ws:127.0.0.1:10083");
    ws = new WebSocket("ws:"+ip+":"+port);

    ws.onopen = function(msg){
        console.log("websocket opened!");
        callback();
    }
    ws.onmessage = function(message){

        var reader = new FileReader();
        var streamStr = message.data;
        reader.readAsArrayBuffer(streamStr);

        reader.onload = function (e) {
            console.info(reader.result);

            fileReaderOnLoad(reader.result);
            if (submitStart && !isStart) {
                player.play();
                isStart = true;
            }
            
            // ws.send("aaa");
        };
    }
    ws.onerror = function(err){
        console.log("error:"+err.name+err.number);
    }
    ws.onclose = function(){
        console.log("websocket closed!")
    }
};

function startPlay() {
    submitStart = true;
    player.play();
    isStart = true;
    VIDEO_PTS_VAL = 0;
}

function toClose() {
    console.log(ws.readyState);
    ws.close();
    console.log(ws.readyState);
    ws.onclose = function(){};
    ws.onmessage = function(){};
    ws.onerror = function(){};
    ws.onopen = function(){};
    player.stop();
    isStart = false;
}

// oper
function initPlay() {
    // getLiveWS("127.0.0.1", 10084, initSucWSPlay); // conn ws
    getLiveWS("123.57.50.178", 10084, function(){
        console.log("connect ok");
        ws.send("aaa");
    }); // conn ws
    // player.play();
}

function pause() {
    player.pause();
}

function continues() {
    player.continues();
}

// function stopPlay() {
//     endLive();
//     player.stop();
// }


function fileReaderOnLoad(streamBufInput) {
    VIDEO_PTS_VAL = 0;

    // demux mp4
    var streamBuf = new Uint8Array(streamBufInput).buffer;
    console.log(streamBuf);
    mp4Obj.demux(streamBuf);
    var durationMs  = mp4Obj.getDurationMs();
    var fps         = mp4Obj.getFPS();
    var sampleRate  = mp4Obj.getSampleRate();
    var size        = mp4Obj.getSize();


    console.log("get fps" + fps + ",sampleRate : " + sampleRate);
    console.log("get durationMs" + durationMs + ",size : ");
    console.log(size);

    function playerCreateCallback() {
        console.log("createPlayer Done!");
        player.setDurationMs(durationMs);

        // player load success
        timeLoop = window.setInterval(function() {
            var popData     = mp4Obj.popBuffer(1)
            var popDataAudio= mp4Obj.popBuffer(2);

            console.log("to video popData");
            console.log(popData);   

            console.log("to audio append");
            console.log(popDataAudio);   
            
            if (popData != null) {
                player.appendHevcFrame(popData);
            }
            if (popDataAudio && popDataAudio != null) {
                player.appendAACFrame(popDataAudio);
            }

            // console.log("=================================");
            if (popDataAudio == null && popData == null) {
                // break;
                console.log("to break loop");
                window.clearInterval(timeLoop);
                ws.send("aaa");
            }
        }, 1);

        // document.getElementById("startPlay").disabled = false;
    }

    // width       : size["width"] + "px",
    // height      : size["height"] + "px",
    if (playerStatus) {
        playerCreateCallback();
    } else {
        playerStatus = player.createPlayer({
            width           : "600px",
            height          : "600px",
            fps             : fps,
            sampleRate      : sampleRate,
            fixed           : false,
            appendHevcType  : APPEND_TYPE_FRAME
        }, playerCreateCallback);
    }
}

window.onload = function() {
    player = Init(function(){
        initPlay();
    });
};