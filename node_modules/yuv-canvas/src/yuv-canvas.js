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
    SoftwareFrameSink = require('./SoftwareFrameSink.js'),
    WebGLFrameSink = require('./WebGLFrameSink.js');

  /**
   * @typedef {Object} YUVCanvasOptions
   * @property {boolean} webGL - Whether to use WebGL to draw to the canvas and accelerate color space conversion. If left out, defaults to auto-detect.
   */

  var YUVCanvas = {
    FrameSink: FrameSink,

    SoftwareFrameSink: SoftwareFrameSink,

    WebGLFrameSink: WebGLFrameSink,

    /**
     * Attach a suitable FrameSink instance to an HTML5 canvas element.
     *
     * This will take over the drawing context of the canvas and may turn
     * it into a WebGL 3d canvas if possible. Do not attempt to use the
     * drawing context directly after this.
     *
     * @param {HTMLCanvasElement} canvas - HTML canvas element to attach to
     * @param {YUVCanvasOptions} options - map of options
     * @returns {FrameSink} - instance of suitable subclass.
     */
    attach: function(canvas, options) {
      options = options || {};
      var webGL = ('webGL' in options) ? options.webGL : WebGLFrameSink.isAvailable();
      if (webGL) {
        return new WebGLFrameSink(canvas, options);
      } else {
        return new SoftwareFrameSink(canvas, options);
      }
    }
  };

  module.exports = YUVCanvas;
})();
