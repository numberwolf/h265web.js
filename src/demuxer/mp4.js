const MP4Box = require('mp4box')
const SAMPLE_INDEX = {
    96000 : 0x00,
    88200 : 0x01,
    64000 : 0x02,
    48000 : 0x03,
    44100 : 0x04,
    32000 : 0x05,
    24000 : 0x06,
    22050 : 0x07,
    16000 : 0x08,
    12000 : 0x09,
    11025 : 0x0a,
    8000 : 0x0b,
    7350 : 0x0c,
    'Reserved' : 0x0d, // == 0x0e
    'frequency is written explictly' : 0x0f
}
/* aacProfile
    00 - NULL
    01 - AAC Main (a deprecated AAC profile from MPEG-2)
    02 - AAC LC or backwards compatible HE-AAC (Most realworld AAC falls in one of these cases)
    03 - AAC Scalable Sample Rate (rarely used)
    03 - AAC LTP (a replacement for AAC Main, rarely used)
    05 - HE-AAC explicitly signaled (Non-backward compatible)
    22 - ER BSAC (A Korean broadcast codec)
    23 - Low Delay AAC
    29 - HE-AACv2 explicitly signaled (In one draft this was MP3On4 instead)
    31 - ESCAPE (read 6 more bits, add 32)
    32 - MP3on4 Layer 1
    33 - MP3on4 Layer 2
    34 - MP3on4 Layer 3

aac adTS packet
   ff       f1         50     40       01       7f       fc       --> 01182007
11111111 11110001 01010000 0100 0000 00000001 01111111 11111100
                               |
|------------- 28bits----------|-----------------28 bits-------|
                                 |00 00000001 011| = pkt length = 1011 = 11 (bytes)
                                 --------------------------------------------------
                                 |     ff f1 50 40 01 7f fc 01 18 20 07 <- 11 bytes
*/
const setStartCode = frame => { //replace first 4 bytes with 0001
    frame[0] = frame[1] = frame[2] = 0
    frame[3] = 1
    return frame
}
const setVideoFrameHeaders = (sample, firstFrame) => {
    //VPS, SPS, PPS, SEI, DATA
    const frame = []
    const nalus = sample.description.hvcC.nalu_arrays
    nalus.forEach(nalu => frame.push(0, 0, 0, 1, ...nalu[0].data))
    frame.push(...firstFrame.data)
    firstFrame.data = new Uint8Array(frame)
}
const addAudioFrame = (frame, sampleRate, aacProfile, channels)  => {
    const freqIdx = SAMPLE_INDEX[sampleRate]
    const adtsHead = new Uint8Array(7)
    const packetLen = adtsHead.length + frame.length
    adtsHead[0] = 0xff
    adtsHead[1] = 0xf1
    adtsHead[2] = (((aacProfile - 1) << 6) + (freqIdx << 2) + (channels >> 2))
    adtsHead[3] = (((channels & 3) << 6) + (packetLen >> 11))
    adtsHead[4] = ((packetLen & 0x7FF) >> 3)
    adtsHead[5] = (((packetLen & 7) << 5) + 0x1F)
    adtsHead[6] = 0xfc
    const data = new Uint8Array(packetLen)
    data.set(adtsHead, 0)
    data.set(frame, adtsHead.length)
    return data
}
const initializeAllSourceBuffers = (mp4boxfile, movieInfo) => {
    const onInitAppended = e => {
        if (e.target.ms.readyState === 'open') {
            e.target.sampleNum = 0
            e.target.removeEventListener('updateend', onInitAppended)
            e.target.ms.pendingInits--
            if (e.target.ms.pendingInits === 0) {
                mp4boxfile.start()
            }
        }
    }
    for (const track of movieInfo.tracks)
        mp4boxfile.setExtractionOptions(track.id)

    const initSegs = mp4boxfile.initializeSegmentation()
    for (var i = 0; i < initSegs.length; i++) {
        const sb = initSegs[i].user
        if (i === 0) sb.ms.pendingInits = 0
        sb.addEventListener('updateend', onInitAppended)
        sb.appendBuffer(initSegs[i].buffer)
        sb.segmentIndex = 0
        sb.ms.pendingInits++
    }    
    mp4boxfile.start()
}
module.exports = dataStream => {
    dataStream.fileStart = 0
    const mp4boxfile = MP4Box.createFile()
    const mp4 = {
        duration: -1.0,
        fps: -1,
        sampleRate: -1,
        aacProfile: 2, //LC
        audioChannels: 2,
        width: -1,
        height: -1,
        videoFrames: [],
        audioFrames: []
    }
    mp4boxfile.onError = e => {throw e}
    mp4boxfile.onReady = (info) => {
        console.log(info)
        const durationInSeconds = (info.videoTracks[0].samples_duration / info.videoTracks[0].timescale)
        const audioCodecDesc = info.audioTracks[0].codec.split('.')
        mp4.duration = 1000 * durationInSeconds
        mp4.fps = info.videoTracks[0].nb_samples / durationInSeconds
        mp4.sampleRate = info.audioTracks[0].audio.sample_rate
        mp4.aacProfile = audioCodecDesc[audioCodecDesc.length-1]
        mp4.audioChannels = info.audioTracks[0].audio.channel_count
        mp4.width = info.videoTracks[0].track_width
        mp4.height = info.videoTracks[0].track_height
        initializeAllSourceBuffers(mp4boxfile, info)
    }
    mp4boxfile.onSamples = (id, user, samples) => {
        for (const sample of samples) {
            const pts = (sample.dts) / sample.timescale;
            id == 1 && mp4.videoFrames.push({ pts, data: setStartCode(sample.data) })
            id == 2 && mp4.audioFrames.push({ pts, data: addAudioFrame(
                sample.data,
                mp4.sampleRate,
                mp4.aacProfile,
                mp4.audioChannels
            ) })
        }
        id == 1 && setVideoFrameHeaders(samples[0], mp4.videoFrames[0])
        //TODO: parse id type text eg: id == 3
    }
    mp4boxfile.appendBuffer(dataStream)
    mp4boxfile.flush()
    return mp4
}
