# ffmpeg -i veilside.mp4 -vcodec libx265 -acodec aac -ar 22050 -map 0 -f segment -segment_list veilside.m3u8 -segment_time 10 -y ./hls/v-%03d.ts
ffmpeg -f avfoundation -i 1:0 \
-q 4 -r 10 \
-filter_complex "scale=1280:720" \
-pix_fmt yuv420p \
-vcodec libx265 \
-ar 22050 -ab 64k -ac 1 -acodec aac \
-threads 4 \
-preset veryfast \
-f segment \
-segment_list test.m3u8 \
-segment_time 5 \
-y /Users/numberwolf/Documents/webroot/VideoMissile/VideoMissilePlayer/res/hls1/v-%03d.ts \
