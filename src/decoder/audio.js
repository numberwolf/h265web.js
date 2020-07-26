//TODO: seek should work based on frame, not time, that is player's job to do time stuff
// decode function should take a single audio frame to be decoded, but that's not possible with webaudio
// https://webaudio.github.io/web-audio-api/#dictdef-audiocontextoptions
const AudioContext 	= window.AudioContext || window.webkitAudioContext
module.exports = sampleRate => {
	sampleRate = sampleRate || 44100
	const ctx = new AudioContext({ latencyHint: 'interactive', sampleRate })
	const src = ctx.createBufferSource()
	return {
		ctx,
		seek: toTime => src.disconnect() && src.connect(ctx.destination) && src.start(0, toTime),
		pause: () => ctx.suspend().then(() => console.log('.audio state: ' + ctx.state)),
		play: () => ctx.resume().then(() => console.log(',audio state: ' + ctx.state)),
		decode: audioFrames => {
			const input = new Uint8Array(audioFrames.map(x => x.data).reduce((a, b) => [...a, ...b], []))
			return ctx.decodeAudioData(input.buffer).then(buffer => {
				src.buffer = buffer
				src.connect(ctx.destination)
				src.start()
				console.log('audio decoded ', audioFrames.length, ' audio frames')
			})
		}
	}
}
