<template>
  <div class="context">
    <div class="header-line">
      <h2>h265Web.js Player Demo</h2>
    </div>
    <!-- video player content -->
    <div class="player-container">
      <div id="glplayer" class="glplayer"></div>
    </div>
    <div class="timeline__container">
      <span>TimeLine</span>
      <span id="ptsLabel" class="timeline" ref="timelineRef"
        >00:00:00/00:00:00</span
      >
    </div>
    <div class="player__button" role="button" @click="resumeHandler">
      RESUME
    </div>
    <div class="player__button" role="button" @click="pauseHandler">PAUSE</div>
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
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import { createPlayerServer, executePlayerServer } from "./services/player";

/**
 * By default we define a constant vairiable should without vue module
 */
const URL = "hevc_test_moov_set_head_16s.mp4";
const H265JS_DEFAULT_PLAYER_CONFIG = {
  player: "glplayer",
  width: 960,
  height: 540,
  token:
    "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1",
  extInfo: {
    moovStartFlag: true,
  },
};

export default defineComponent({
  setup() {
    const timelineRef = ref(null);
    let playerObject = null;
    const resolveConfig = (conf) =>
      Object.assign(H265JS_DEFAULT_PLAYER_CONFIG, conf);

    onMounted(() => {
      playerObject = createPlayerServer(URL, resolveConfig());
      executePlayerServer(playerObject, timelineRef.value);
    });

    onUnmounted(() => {
      playerObject = null;
    });

    const playAction = (action) => {
      // console.log(playerObject);
      if (action === "pause" && playerObject.isPlaying()) {
        console.log("[Action]: Pause");
        playerObject.pause();
        return;
      }
      if (action === "resume" && !playerObject.isPlaying()) {
        console.log("[Action]: Resume");
        playerObject.play();
        return;
      }
    };

    const resumeHandler = () => playAction("resume");

    const pauseHandler = () => playAction("pause");

    return { resumeHandler, pauseHandler, timelineRef };
  },
});
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

.timeline__container {
  margin: 5px 0;
}

.timeline__container span:nth-child(2) {
  margin-left: 10px;
}
</style>
