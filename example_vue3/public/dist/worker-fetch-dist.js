(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

// console.log("import raw worker!!!");
function fetchData(url265) {
  var fetchFinished = false;
  var startFetch = false;

  if (!startFetch) {
    startFetch = true;
    fetch(url265).then(function (response) {
      var pump = function pump(reader) {
        return reader.read().then(function (result) {
          if (result.done) {
            // console.log("========== RESULT DONE ===========");
            fetchFinished = true;
            postMessage({
              cmd: 'fetch-fin',
              data: null,
              msg: 'fetch-fin'
            }); // window.clearInterval(networkInterval);
            // networkInterval = null;

            return;
          }

          var chunk = result.value;
          postMessage({
            cmd: 'fetch-chunk',
            data: chunk,
            msg: 'fetch-chunk'
          }); // rawParser.appendStreamRet(chunk);

          return pump(reader);
        });
      };

      return pump(response.body.getReader());
    })["catch"](function (error) {
      console.log(error);
    });
  }
}

onmessage = function onmessage(event) {
  // console.log("worker.onmessage", event);
  var body = event.data;
  var cmd = null;

  if (body.cmd === undefined || body.cmd === null) {
    cmd = '';
  } else {
    cmd = body.cmd;
  } // console.log("worker recv cmd:", cmd);


  switch (cmd) {
    case 'start':
      // console.log("worker start");
      var url = body.data;
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
  }

  ;
};

},{}]},{},[1]);
