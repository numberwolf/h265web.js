//TODO: check if browser has web assembly and the audio decoder, and a decent screen, otherwise don't even load the page
// const $ = id => document.getElementById(id)
const H265webjs = require('./src/h265webjs')
global.makeH265webjs = (videoURL, config) => {
    let h265webjs = new H265webjs.H265webjs(videoURL, config);
    return h265webjs;
}