import RawParserModule from './dist/raw-parser.js';
// console.log("import parse worker!!!", RawParserModule);
var g_RawParser = new RawParserModule();

onmessage = (event) => {

    // console.log("parse - worker.onmessage", event);
    let body = event.data;
    let cmd = null;
    if (body.cmd === undefined || body.cmd === null) {
    	cmd = '';
    } else {
    	cmd = body.cmd;
    }

    // console.log("parse - worker recv cmd:", cmd);

    switch (cmd) {
        case 'append-chunk':
        	// console.log("parse - worker append-chunk");
        	let chunk = body.data;
            g_RawParser.appendStreamRet(chunk);
            break;
        case 'get-nalu':
            // let nalBuf = g_RawParser.nextNalu();
            let nalBuf = g_RawParser.nextFrame();
            // console.log("parse - worker get-nalu", nalBuf);

            // if (nalBuf != false) {
                postMessage({
                    cmd : "return-nalu",
                    data : nalBuf,
                    msg : "return-nalu"
                });
            // }

            break;
        case 'stop':
        	// console.log("parse - worker stop");
            postMessage('parse - WORKER STOPPED: ' + body);
           	close(); // Terminates the worker.
            break;
        default:
        	// console.log("parse - worker default");
        	// console.log("parse - worker.body -> default: ", body);
            // worker.postMessage('Unknown command: ' + data.msg);
            break;
    };
};