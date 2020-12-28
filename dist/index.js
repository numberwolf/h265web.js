require('./h265webjs');
export default class h265webjs {
	static createPlayer(videoURL, config) {
		return window.new265webjs(videoURL, config);
	}
}