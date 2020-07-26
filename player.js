//TODO: check if browser has web assembly and the audio decoder, and a decent screen, otherwise don't even load the page
// const $ = id => document.getElementById(id)
const Player = require('./src/player')
const durationText = duration => `${Math.floor(duration / 3600)}:${Math.floor((duration % 3600) / 60)}:${Math.floor((duration % 60))}`

window.onload = () => {
    const status = document.createElement('div')
    status.textContent = 'Loading...'
    const play = document.createElement('button')
    play.style.fontSize = '23px'
    play.textContent = '[>]'
    play.disabled = true
    play.onclick = () => {
        player.isPlaying = !player.isPlaying
        play.textContent = player.isPlaying ? '[||]' : '[>]'
        player.isPlaying ? player.play() : player.stop()
    }
    const ptsLabel = document.createElement('span')
    ptsLabel.style.fontSize = '23px'
    const progress = document.createElement('progress')
    progress.style.width = '80%'
    progress.style.height = '80px'
    
    progress.value = 0
    document.body.appendChild(status)
    document.body.appendChild(play)
    document.body.appendChild(progress)    
    document.body.appendChild(ptsLabel)

    const player = Player({
        container: document.querySelector('div#glplayer'),
        url: '/res/video.mp4'
    })
    player.onReady(() => {
        ptsLabel.textContent = '0:0:0/' + durationText(progress.max = player.duration / 1000)
        status.textContent = ''
        play.disabled = false
        //hide loading gif
    })
    player.onUpdate = (videoPTS, audioPTS) => {
        const now = durationText(progress.value = videoPTS)
        const total = durationText(player.duration / 1000)
        ptsLabel.textContent = `${now}/${total}`
    }
    player.onStop = () => {
        console.log('Video stopped ...')
        player.isPlaying && play.onclick()
    }
}
