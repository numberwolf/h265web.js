import { createApp } from 'vue'
import App from './App.vue'

const loadScript = (url) =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      reject('cannot load script ' + url)
    }
    document.body.appendChild(script)
  })

loadScript('/dist/missile-v20220421.js').then((res) => createApp(App).mount('#app'))
