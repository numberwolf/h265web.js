const YUVBuffer = require('yuv-buffer');
const YUVCanvas = require('yuv-canvas');

class ScreenModule {
    constructor() {
        this.screenW = window.screen.width;
        this.screenH = window.screen.height;
        this.fixed = false;

        this.screenCanvasBox = null;
        this.screenCanvas = null;
        this.screenYuv = null;

        this._makeScreenGL();

        // Event
        this.onClose = null;
    }

    render(width, height, imageBufferY, imageBufferB, imageBufferR) {
        this.screenYuv.clear();

        let displayWH = this._checkScreenDisplaySize(width, height);
        let format = YUVBuffer.format({
            width:          width,
            height:         height,
            chromaWidth:    width / 2,
            chromaHeight:   height / 2,
            displayWidth:   this.screenCanvas.offsetWidth,
            displayHeight:  this.screenCanvas.offsetHeight
        })
        let frame = YUVBuffer.frame(format);
        frame.y.bytes = imageBufferY;
        frame.y.stride = width;
        frame.u.bytes = imageBufferB;
        frame.u.stride = width / 2;
        frame.v.bytes = imageBufferR;
        frame.v.stride = width / 2;
        this.screenYuv.drawFrame(frame);
    }

    open() {
        this.screenCanvasBox.style.display = 'block';
    }

    close() {
        this.screenCanvasBox.style.display = 'none';
        if (this.onClose != null) this.onClose();
    }

    /*
     * full screen
     */
    _checkScreenDisplaySize(widthIn, heightIn) {
        let biggerWidth = widthIn / this.screenW > heightIn / this.screenH;
        let fixedWidth = (this.screenW / widthIn).toFixed(2);
        let fixedHeight = (this.screenH / heightIn).toFixed(2);
        let scaleRatio = biggerWidth ? fixedWidth : fixedHeight;
        let width = this.fixed ? this.screenW : parseInt(widthIn  * scaleRatio);
        let height = this.fixed ? this.screenH : parseInt(heightIn * scaleRatio);
        if (this.screenCanvas.offsetWidth != width || this.screenCanvas.offsetHeight != height) {
            let topMargin = parseInt((this.screenCanvasBox.offsetHeight - height) / 2);
            let leftMargin = parseInt((this.screenCanvasBox.offsetWidth - width) / 2);
            this.screenCanvas.style.marginTop = topMargin + 'px';
            this.screenCanvas.style.marginLeft = leftMargin + 'px';
            this.screenCanvas.style.width = width + 'px';
            this.screenCanvas.style.height = height + 'px';
        }
        return [width, height];
    };

    _makeScreenGL() {
        let canvasBox = document.createElement('div');
        // canvasBox.style.position = 'relative';
        canvasBox.style.backgroundColor = 'black';
        canvasBox.style.width = this.screenW + 'px';
        canvasBox.style.height = this.screenH + 'px';
        canvasBox.style.display = 'none';
        // canvasBox.style.display = 'block';
        canvasBox.style.position = 'absolute';
        canvasBox.style.zIndex = '2001';
        canvasBox.style.overflow = 'auto';
        canvasBox.style.top = "0px";
        canvasBox.style.left = "0px";

        let canvas = document.createElement('canvas');
        canvas.style.width = canvasBox.clientWidth + 'px';
        canvas.style.height = canvasBox.clientHeight + 'px';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvasBox.appendChild(canvas);
        this.screenCanvasBox = canvasBox;
        this.screenCanvas = canvas;
        this.screenYuv = YUVCanvas.attach(canvas); // this.screenYuv.clear() //clearing the canvas?

        document.body.appendChild(canvasBox);

        this._addCloseBtn();
    }

    _addCloseBtn() {
        let _this = this;
        let closeBtn = document.createElement('button');
        closeBtn.style.backgroundColor = 'white';
        closeBtn.style.width = '30px';
        closeBtn.style.height = '30px';
        closeBtn.style.display = 'block';
        closeBtn.style.position = 'absolute';
        closeBtn.style.zIndex = '2002';
        closeBtn.style.overflow = 'auto';
        closeBtn.style.top = "5px";
        closeBtn.style.left = "5px";
        closeBtn.textContent = "X";

        closeBtn.onclick = () => {
            _this.close();
        };

        this.screenCanvasBox.appendChild(closeBtn);
    }
}

exports.Screen = ScreenModule;