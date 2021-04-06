// const VERSION = 'v20210406';
// const MOD_NAME = './h265webjs-' + VERSION;
// require('./h265webjs-' + VERSION + '.js');
// require(MOD_NAME);
require('./h265webjs-v20210406');
export default class h265webjs {
	static createPlayer(videoURL, config) {
		return window.new265webjs(videoURL, config);
	}

	static clear() {
		global.STATICE_MEM_playerCount = -1;
		global.STATICE_MEM_playerIndexPtr = 0;
    }
}