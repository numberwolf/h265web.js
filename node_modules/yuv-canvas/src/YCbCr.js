/*
Copyright (c) 2014-2019 Brion Vibber <brion@pobox.com>

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

	var depower = require('./depower.js');

	/**
	 * Basic YCbCr->RGB conversion
	 *
	 * @author Brion Vibber <brion@pobox.com>
	 * @copyright 2014-2019
	 * @license MIT-style
	 *
	 * @param {YUVFrame} buffer - input frame buffer
	 * @param {Uint8ClampedArray} output - array to draw RGBA into
	 * Assumes that the output array already has alpha channel set to opaque.
	 */
	function convertYCbCr(buffer, output) {
		var width = buffer.format.width | 0,
			height = buffer.format.height | 0,
			hdec = depower(buffer.format.width / buffer.format.chromaWidth) | 0,
			vdec = depower(buffer.format.height / buffer.format.chromaHeight) | 0,
			bytesY = buffer.y.bytes,
			bytesCb = buffer.u.bytes,
			bytesCr = buffer.v.bytes,
			strideY = buffer.y.stride | 0,
			strideCb = buffer.u.stride | 0,
			strideCr = buffer.v.stride | 0,
			outStride = width << 2,
			YPtr = 0, Y0Ptr = 0, Y1Ptr = 0,
			CbPtr = 0, CrPtr = 0,
			outPtr = 0, outPtr0 = 0, outPtr1 = 0,
			colorCb = 0, colorCr = 0,
			multY = 0, multCrR = 0, multCbCrG = 0, multCbB = 0,
			x = 0, y = 0, xdec = 0, ydec = 0;

		if (hdec == 1 && vdec == 1) {
			// Optimize for 4:2:0, which is most common
			outPtr0 = 0;
			outPtr1 = outStride;
			ydec = 0;
			for (y = 0; y < height; y += 2) {
				Y0Ptr = y * strideY | 0;
				Y1Ptr = Y0Ptr + strideY | 0;
				CbPtr = ydec * strideCb | 0;
				CrPtr = ydec * strideCr | 0;
				for (x = 0; x < width; x += 2) {
					colorCb = bytesCb[CbPtr++] | 0;
					colorCr = bytesCr[CrPtr++] | 0;

					// Quickie YUV conversion
					// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
					// multiplied by 256 for integer-friendliness
					multCrR   = (409 * colorCr | 0) - 57088 | 0;
					multCbCrG = (100 * colorCb | 0) + (208 * colorCr | 0) - 34816 | 0;
					multCbB   = (516 * colorCb | 0) - 70912 | 0;

					multY = 298 * bytesY[Y0Ptr++] | 0;
					output[outPtr0    ] = (multY + multCrR) >> 8;
					output[outPtr0 + 1] = (multY - multCbCrG) >> 8;
					output[outPtr0 + 2] = (multY + multCbB) >> 8;
					outPtr0 += 4;

					multY = 298 * bytesY[Y0Ptr++] | 0;
					output[outPtr0    ] = (multY + multCrR) >> 8;
					output[outPtr0 + 1] = (multY - multCbCrG) >> 8;
					output[outPtr0 + 2] = (multY + multCbB) >> 8;
					outPtr0 += 4;

					multY = 298 * bytesY[Y1Ptr++] | 0;
					output[outPtr1    ] = (multY + multCrR) >> 8;
					output[outPtr1 + 1] = (multY - multCbCrG) >> 8;
					output[outPtr1 + 2] = (multY + multCbB) >> 8;
					outPtr1 += 4;

					multY = 298 * bytesY[Y1Ptr++] | 0;
					output[outPtr1    ] = (multY + multCrR) >> 8;
					output[outPtr1 + 1] = (multY - multCbCrG) >> 8;
					output[outPtr1 + 2] = (multY + multCbB) >> 8;
					outPtr1 += 4;
				}
				outPtr0 += outStride;
				outPtr1 += outStride;
				ydec++;
			}
		} else {
			outPtr = 0;
			for (y = 0; y < height; y++) {
				xdec = 0;
				ydec = y >> vdec;
				YPtr = y * strideY | 0;
				CbPtr = ydec * strideCb | 0;
				CrPtr = ydec * strideCr | 0;

				for (x = 0; x < width; x++) {
					xdec = x >> hdec;
					colorCb = bytesCb[CbPtr + xdec] | 0;
					colorCr = bytesCr[CrPtr + xdec] | 0;

					// Quickie YUV conversion
					// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
					// multiplied by 256 for integer-friendliness
					multCrR   = (409 * colorCr | 0) - 57088 | 0;
					multCbCrG = (100 * colorCb | 0) + (208 * colorCr | 0) - 34816 | 0;
					multCbB   = (516 * colorCb | 0) - 70912 | 0;

					multY = 298 * bytesY[YPtr++] | 0;
					output[outPtr    ] = (multY + multCrR) >> 8;
					output[outPtr + 1] = (multY - multCbCrG) >> 8;
					output[outPtr + 2] = (multY + multCbB) >> 8;
					outPtr += 4;
				}
			}
		}
	}

	module.exports = {
		convertYCbCr: convertYCbCr
	};
})();
