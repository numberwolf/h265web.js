/*
Copyright (c) 2014-2016 Brion Vibber <brion@pobox.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
MPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function() {
	"use strict";

	var FrameSink = require('./FrameSink.js'),
		YCbCr = require('./YCbCr.js');

	/**
	 * @param {HTMLCanvasElement} canvas - HTML canvas eledment to attach to
	 * @constructor
	 */
	function SoftwareFrameSink(canvas) {
		var self = this,
			ctx = canvas.getContext('2d'),
			imageData = null,
			resampleCanvas = null,
			resampleContext = null;



		function initImageData(width, height) {
			imageData = ctx.createImageData(width, height);

			// Prefill the alpha to opaque
			var data = imageData.data,
				pixelCount = width * height * 4;
			for (var i = 0; i < pixelCount; i += 4) {
				data[i + 3] = 255;
			}
		}

		function initResampleCanvas(cropWidth, cropHeight) {
			resampleCanvas = document.createElement('canvas');
			resampleCanvas.width = cropWidth;
			resampleCanvas.height = cropHeight;
			resampleContext = resampleCanvas.getContext('2d');
		}

		/**
		 * Actually draw a frame into the canvas.
		 * @param {YUVFrame} buffer - YUV frame buffer object to draw
		 */
		self.drawFrame = function drawFrame(buffer) {
			var format = buffer.format;

			if (canvas.width !== format.displayWidth || canvas.height !== format.displayHeight) {
				// Keep the canvas at the right size...
				canvas.width = format.displayWidth;
				canvas.height = format.displayHeight;
			}

			if (imageData === null ||
					imageData.width != format.width ||
					imageData.height != format.height) {
				initImageData(format.width, format.height);
			}

			// YUV -> RGB over the entire encoded frame
			YCbCr.convertYCbCr(buffer, imageData.data);

			var resample = (format.cropWidth != format.displayWidth || format.cropHeight != format.displayHeight);
			var drawContext;
			if (resample) {
				// hack for non-square aspect-ratio
				// putImageData doesn't resample, so we have to draw in two steps.
				if (!resampleCanvas) {
					initResampleCanvas(format.cropWidth, format.cropHeight);
				}
				drawContext = resampleContext;
			} else {
				drawContext = ctx;
			}

			// Draw cropped frame to either the final or temporary canvas
			drawContext.putImageData(imageData,
				-format.cropLeft, -format.cropTop, // must offset the offset
				format.cropLeft, format.cropTop,
				format.cropWidth, format.cropHeight);

			if (resample) {
				ctx.drawImage(resampleCanvas, 0, 0, format.displayWidth, format.displayHeight);
			}
		};

		self.clear = function() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};

		return self;
	}

	SoftwareFrameSink.prototype = Object.create(FrameSink.prototype);

	module.exports = SoftwareFrameSink;
})();
