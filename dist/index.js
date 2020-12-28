require('./h265webjs');
export default class h265webjs {
	static createPlayer(videoURL, config) {
		return new265webjs(videoURL, config);
	}
}