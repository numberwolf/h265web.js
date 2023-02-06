// console.log("import raw worker!!!");

function fetchData(url265) {
    let fetchFinished = false;
    let startFetch = false;

    if (!startFetch) {
        startFetch = true;
        fetch(url265).then(function(response) {
            let pump = function(reader) {
                return reader.read().then(function(result) {
                    if (result.done) {
                        console.log("========== RESULT DONE ===========");
                        fetchFinished = true;
                        postMessage({
                            cmd: 'fetch-fin',
                            data: null, 
                            msg: 'fetch-fin'
                        });
                        // window.clearInterval(networkInterval);
                        // networkInterval = null;
                        return;
                    }

                    let chunk = result.value;
                    postMessage({
		            	cmd: 'fetch-chunk',
		            	data: chunk, 
		            	msg: 'fetch-chunk'
		            });
                    console.log("call chunk", chunk.length);
                    // rawParser.appendStreamRet(chunk);
                    return pump(reader);
                });
            }
            return pump(response.body.getReader());
        })
        .catch(function(error) {
            console.log(error);
        });
    }
}

onmessage = (event) => {

    // console.log("worker.onmessage", event);
    let body = event.data;
    let cmd = null;
    if (body.cmd === undefined || body.cmd === null) {
    	cmd = '';
    } else {
    	cmd = body.cmd;
    }

    // console.log("worker recv cmd:", cmd);

    switch (cmd) {
        case 'start':
        	// console.log("worker start");
        	let url = body.data;
        	fetchData(url);
            postMessage({
            	cmd: 'default',
            	data: 'WORKER STARTED', 
            	msg: 'default'
            });
            break;
        case 'stop':
        	// console.log("worker stop");
            // postMessage('WORKER STOPPED: ' + body);
           	close(); // Terminates the worker.
            break;
        default:
        	// console.log("worker default");
        	// console.log("worker.body -> default: ", body);
            // worker.postMessage('Unknown command: ' + data.msg);
            break;
    };
};
