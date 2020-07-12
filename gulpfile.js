'use strict';

var browserify      = require('browserify')
var gulp            = require('gulp');
var concat          = require('gulp-concat');

// var print = require('gulp-print');
var babel           = require('gulp-babel');
var uglify          = require('gulp-uglify');
var clean           = require('gulp-clean');

var source          = require('vinyl-source-stream');
var gulpSequence    = require('gulp-sequence');
var buffer          = require('vinyl-buffer');


var concatJs        = "concat.js";
var outJs           = "missile.js";

gulp.task('concat', function (done) {
    console.log("start script");

    return gulp.src([
        './src/decoder/common.js',
        './src/decoder/codec.js',
        './src/decoder/audio.js',
        './src/decoder/player.js',
        // './src/decoder/live.js',
        './src/decoder/play-base.js',
        './src/demuxer/mp4.js',
        './src/core/missile.js'
    ])
    .pipe(babel({
        presets: ['@babel/env', {
            "sourceType": "script"
        }]
    }))
    .pipe(concat(concatJs))
    .pipe(uglify({
        mangle: true,//类型：Boolean 默认：true 是否修改变量名
        compress: true//类型：Boolean 默认：true 是否完全压缩
    }))
    .pipe(gulp.dest('dist'));
    // .pipe(clean());

    done();
});

gulp.task('init', gulp.series('concat',function(done) {
    console.log("start browserify");

    return browserify('./dist/' + concatJs)
    .bundle()
    .pipe(source(outJs))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(uglify()) // now gulp-uglify works 
    .pipe(gulp.dest('./dist'));

    done();
}));

// gulp.task('init',gulpSequence('script','browserify'));


// gulp.watch(['dist/missile.js'], function({
// });
