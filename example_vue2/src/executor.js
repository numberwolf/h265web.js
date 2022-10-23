const PRESET_CONFIG = {
  player: "glplayer",
  width: 960,
  height: 540,
  token:
    "base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1",
  extInfo: {
    moovStartFlag: true,
  },
};

// FYI. the Player class is a wrapper container provide the init and destory methods.
// you should destory the player instance at the page unshift time.
// By the way if you want to impl a progress bar you should view the normal_example.
// It's a  full example. This demo only provide a minimalist case.
// Why use class? Convenient der is enough :)
// Should I registry the instnace at a microTask? Of course.
// Pay attention to index.html. vite boy. Don't forget import the static source code :)

export class Player {
  #config = {};
  instance;
  constructor(opt = {}) {
    const { presetConfig = PRESET_CONFIG } = opt;
    if (presetConfig) Object.assign(this.#config, presetConfig);
  }

  destory() {
    //
    this.instance.release();
  }
  init(url) {
    this.instance = window.new265webjs(url, this.#config);
  }
}
