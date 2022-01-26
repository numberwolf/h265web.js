<template>
  <div class="context">
    <div class="header-line">
      <h2>h265Web.js Player Demo</h2>
    </div>
    <!-- video player content -->
    <div class="player-container">
      <div id="glplayer" class="glplayer"></div>
    </div>
    <div class="player__button">RESUME</div>
    <div class="player__button" role="button">PAUSE</div>
    <!-- comapny tips -->
    <footer>
      <ul>
        <li>
          <a
            aria-label="Github"
            href="https://github.com/numberwolf/h265web.js"
            target="_blank"
            >H265Web.js Github</a
          >
        </li>
        <li>
          <a aria-label="company" href="https://zzsin.com" target="_blank"
            >zzSin</a
          >
        </li>
        <li>
          <a href="mailto:porschegt23@foxmail.com" aria-label="email">Eamil</a>
        </li>
      </ul>
    </footer>
  </div>
</template>

<script>
/**
 * vue/next is same as vue2, so we should init  project
 * in mounted lifecycle.
 */
import { defineComponent, onMounted } from 'vue'
import { createPlayerServer } from './services/player'

/**
 * By default we define a constant vairiable should without vue module
 */
const URL = 'hevc_test_moov_set_head_16s.mp4'
const H265JS_DEFAULT_PLAYER_CONFIG = {
  player: 'glplayer',
  width: 960,
  height: 540,
  token:
    'base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1',
  extInfo: {
    moovStartFlag: true,
  },
}

export default defineComponent({
  setup() {
    let playerObject = null
    const resolveConfig = (conf) =>
      Object.assign(H265JS_DEFAULT_PLAYER_CONFIG, conf)

    onMounted(() => {
      playerObject = createPlayerServer(URL, resolveConfig())
    })


    resumeHandler = () => {}
  },
})
</script>

<style scoped>
.header-line {
  height: 30px;
}

ul {
  margin: 0;
  padding: 0;
}
ul li {
  list-style-type: none;
  padding: 5px 0;
}
ul li a {
  text-decoration: none;
}

.player-container {
  width: 960px;
  height: 540px;
}

.player__button {
  border: 1px solid black;
  width: 80px;
  border-radius: 5px;
  text-align: center;
  margin: 10px 0;
  cursor: pointer;
}
</style>
