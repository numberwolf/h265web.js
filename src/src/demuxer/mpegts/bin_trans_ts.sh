ffmpeg -ss 10 -i veilside.mp4 -t 5 -vcodec libx265 -x265-params "bframes=0" -acodec aac -pix_fmt yuv420p -f mpegts -y veilside.ts
ffmpeg -ss 10 -i veilside.mp4 -t 5 -vcodec libx264 -x264opts "bframes=0" -acodec aac -pix_fmt yuv420p -f mpegts -y veilside.ts
