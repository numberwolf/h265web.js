import H265webjsModule from '../../public/dist/index'

export const createPlayerServer = (videoUrl, config) => {
  return H265webjsModule.createPlayer(videoUrl, config)
}
