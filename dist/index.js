require('./h265webjs');
export default class h265webjs {
	static createPlayer(videoURL, config) {
		return window.new265webjs(videoURL, config);
	}

	static clear() {
        global.STATICE_MEM_playerCount = -1;
    }
}