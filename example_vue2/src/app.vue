<template>
  <div>
    <h1>Example Vue. FYI</h1>

    <div class="context">
      <div class="header-line">
        <h2>h265Web.js Player Demo</h2>
      </div>
      <!-- video player content -->
      <div class="player-container">
        <div id="glplayer" class="glplayer"></div>
      </div>
      <div class="timeline__container"></div>
      <div class="player__button" role="button" @click="pause">RESUME</div>
      <div class="player__button" role="button" @click="resume">PAUSE</div>
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
            <a href="mailto:porschegt23@foxmail.com" aria-label="email"
              >Eamil</a
            >
          </li>
        </ul>
      </footer>
    </div>
  </div>
</template>

<script>
import { Player } from "./executor";
export default {
  data() {
    return {
      url: "hevc_test_moov_set_head_16s.mp4",
      instance: null,
    };
  },
  mounted() {
    const player = new Player();
    player.init(this.url);
    player.instance.do();
    this.instance = player.instance;
  },
  methods: {
    pause() {
      this.instance.play();
    },
    resume() {
      this.instance.pause();
    },
    // todo....
  },
};
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
