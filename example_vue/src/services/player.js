import H265webjsModule from "../../public/dist/index";

const durationFormmat = (val) => {
  val = val.toString();
  if (val.length < 2) return "0" + val;
  return val;
};

const setDurationText = (duration) => {
  if (duration < 0) return "Player";
  const randDuration = Math.round(duration);
  return (
    durationFormmat(Math.floor(randDuration / 3600)) +
    ":" +
    durationFormmat(Math.floor((randDuration % 3600) / 60)) +
    ":" +
    durationFormmat(Math.floor(randDuration % 60))
  );
};

export const createPlayerServer = (videoUrl, config) => {
  return H265webjsModule.createPlayer(videoUrl, config);
};

export const executePlayerServer = (player, timelineEl) => {
  // todo....
  let mediaInfo = null;
  player.onLoadFinish = () => {
    mediaInfo = player.mediaInfo();
    if (mediaInfo.videoType === "vod") {
      timelineEl.textContent =
        setDurationText(0) +
        "/" +
        setDurationText(mediaInfo.meta.durationMs / 1000);
    }
  };
  player.onPlayTime = (pts) => {
    if (mediaInfo.videoType === "vod") {
      timelineEl.textContent =
        setDurationText(pts) +
        "/" +
        setDurationText(mediaInfo.meta.durationMs / 1000);
    }
  };
  player.do();
};
