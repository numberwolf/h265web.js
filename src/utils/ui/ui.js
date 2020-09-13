// UI
// You can design your own playerUI here
class UIModule {
    constructor() {}

    static createPlayerRender(id, w, h) {
        let canvasBox = document.querySelector('div#' + id);
        canvasBox.style.position = 'relative';
        canvasBox.style.backgroundColor = 'black';
        canvasBox.style.width = w + 'px';
        canvasBox.style.height = h + 'px';

        return canvasBox;
    }
}

exports.UI = UIModule;