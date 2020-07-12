
(function() {
  "use strict";

  var YUVBuffer = require('yuv-buffer'),
    YUVCanvas = require('yuv-canvas');

  var canvas = document.querySelector('canvas'),
    yuvCanvas = YUVCanvas.attach(canvas),
    format,
    frame,
    sourceData = {},
    sourceFader = {
      y: 1,
      u: 1,
      v: 1
    };

  function setupFrame() {
    format = YUVBuffer.format({
      width: 640,
      height: 480,
      chromaWidth: 320,
      chromaHeight: 240
    });
    frame = YUVBuffer.frame(format);
  }

  // Rasterize a loaded image and get at its RGBA bytes.
  // We'll use this in sample to get brightnesses from grayscale images.
  function extractImageData(image) {
    var canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth,
    canvas.height = image.naturalHeight;

    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height)
  }

  // In this example we have separate images with Y, U, and V plane data.
  // For each plane, we copy the grayscale values into the target YUVPlane
  // object's data, applying a per-plane multiplier which is manipulable
  // by the user.
  function copyBrightnessToPlane(imageData, plane, width, height, multiplier) {
    // Because we're doing multiplication that may wrap, use the browser-optimized
    // Uint8ClampedArray instead of the default Uint8Array view.
    var clampedBytes = new Uint8ClampedArray(plane.bytes.buffer, plane.bytes.offset, plane.bytes.byteLength);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        clampedBytes[y * plane.stride + x] = imageData.data[y * width * 4 + x * 4] * multiplier;
      }
    }
  }

  function setupSources() {
    function setup(index) {
      var image = document.getElementById(index + 'plane'),
        fader = document.getElementById(index + 'fader');

      function doit() {
        sourceData[index] = extractImageData(image);
        updateFrame();
      }
      if (image.naturalWidth) {
        doit();
      } else {
        image.addEventListener('load', doit);
      }

      fader.addEventListener('input', function() {
        sourceFader[index] = fader.value;
        updateFrame();
      })
    }
    setup('y');
    setup('u');
    setup('v');
  }

  function updateFrame() {
    // Copy data in!
    if (sourceData.y) {
      copyBrightnessToPlane(sourceData.y, frame.y, format.width, format.height, sourceFader.y);
    }
    if (sourceData.u) {
      copyBrightnessToPlane(sourceData.u, frame.u, format.chromaWidth, format.chromaHeight, sourceFader.u);
    }
    if (sourceData.v) {
      copyBrightnessToPlane(sourceData.v, frame.v, format.chromaWidth, format.chromaHeight, sourceFader.v);
    }

    yuvCanvas.drawFrame(frame);
  }

  function setupBenchmark() {
    document.getElementById('benchmark').addEventListener('click', function() {
     var rounds = 1000,
       start = Date.now();
     for (var i = 0; i < rounds; i++) {
       yuvCanvas.drawFrame(frame);
     }
     var delta = (Date.now() - start) / 1000;
     var fps = rounds / delta;
     document.getElementById('fps').innerText = fps + 'fps';
    });
  }

  setupFrame();
  setupSources();
  setupBenchmark();

})();
