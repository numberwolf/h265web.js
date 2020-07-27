//TODO: check if browser has web assembly and the audio decoder, and a decent screen, otherwise don't even load the page
// const $ = id => document.getElementById(id)
const Player = require('./src/player')
window.onload = () => Player({
    container: document.querySelector('div#glplayer'),
    // url: '/res/video8bit.mp4', //default 8 bits so no need to specify
    url: '/res/video10bit.mp4', bits: 10,
    autoHideControls: 3, //hides controls in 3 seconds by default
})
