MEM_SIZE=`expr 512 \* 1024 \* 1024`
##
emcc -s ASSERTIONS=1 -s TOTAL_MEMORY=${MEM_SIZE} -s ALLOW_MEMORY_GROWTH=1 \
-s WASM=1 -O2 \
-s VERBOSE=0 \
-s EXIT_RUNTIME=1 \
-v ffmpeg.bc \
-o ffmpeg3.js --pre-js ffmpeg_pre.js --post-js ffmpeg_post.js

#cp ffmpeg.js /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/
#cp ffmpeg.wasm /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/

cp ffmpeg3.js /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/
cp ffmpeg3.wasm /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/
cp ffmpeg3.js /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/videoconverter.js-origin/demo/
cp ffmpeg3.wasm /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/videoconverter.js-origin/demo/
