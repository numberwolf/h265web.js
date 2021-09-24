// @TODO LIVE

class CLiveCoreModule {
	constructor(config) {
		this.config = {
			width: config.width || def.DEFAULT_WIDTH,
            height: config.height || def.DEFAULT_HEIGHT,
            fps: config.fps || def.DEFAULT_FPS,
            sampleRate: config.sampleRate || def.DEFAULT_SAMPLERATE,
            playerId: config.playerId || def.DEFAILT_WEBGL_PLAY_ID,
            token: config.token || null,
            readyShow: config.readyShow || false,
            checkProbe: config.checkProbe,
            ignoreAudio: config.ignoreAudio,
            playMode: config.playMode || def.PLAYER_MODE_VOD,
        };
    }
}

exports.CLiveCore = CLiveCoreModule;