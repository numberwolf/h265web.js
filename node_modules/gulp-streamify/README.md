# gulp-streamify
> Wrap old [Gulp](http://gulpjs.com/) plugins to support streams.

[![NPM version](https://badge.fury.io/js/gulp-streamify.svg)](https://npmjs.org/package/gulp-streamify) [![Build status](https://secure.travis-ci.org/nfroidure/gulp-streamify.svg)](https://travis-ci.org/nfroidure/gulp-streamify) [![Dependency Status](https://david-dm.org/nfroidure/gulp-streamify.svg)](https://david-dm.org/nfroidure/gulp-streamify) [![devDependency Status](https://david-dm.org/nfroidure/gulp-streamify/dev-status.svg)](https://david-dm.org/nfroidure/gulp-streamify#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/nfroidure/gulp-streamify/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/gulp-streamify?branch=master)

It is pretty annoying when Gulp plugins doesn't support streams. This plugin
 allows you to wrap them in order to use the stream mode anyway. It is pretty
 useful when you want to take advantage of streams on part of your pipelines.

*Note to gulp plugin developpers*: This plugin should not discourage you to
 support streams in your own plugins. I made this plug-in to avoid beeing
 stucked with a bad plugin. If your underlying library support streams, please,
 use it! Even if it doesn't, use
 [BufferStreams](https://npmjs.org/package/bufferstreams)
 in your plugins to support streams at the plugin level (it won't block files
 to buffer their contents like this library has to do to work). Here is a
 [sample of bufferstreams usage](https://github.com/nfroidure/gulp-ttf2eot/blob/master/src/index.js#L73)
 in Gulp plugins.

## Usage

First, install `gulp-streamify` as a development dependency:

```shell
npm install --save-dev gulp-streamify
```

Then, add it to your `gulpfile.js` and wrap all that shit:

```javascript
var streamify = require('gulp-streamify');
var noStreamPlugin = require('gulp-no-stream');

gulp.task('stream', function(){
  gulp.src(['**/*'])
    .pipe( streamify( noStreamPlugin() ) )
    .pipe(gulp.dest('/tmp'));
});
```

If you have several plugins to wrap together, prefer calling `gulp-streamify`
 once thanks to the function form of the `gulp-streamify` constructor:
```javascript
var gStreamify = require('gulp-streamify');
var noStreamPlugin = require('gulp-no-stream');
var noStreamPlugin2 = require('gulp-no-stream2');
var plexer = require('plexer');

gulp.task('stream', function(){
  gulp.src(['**/*'])
    .pipe(streamify(function() {
      var instream = noStreamPlugin();
      var outstream = noStreamPlugin2();
      instream
        .pipe(anyOtherStream)
        .pipe(outStream);
      return plexer(instream, outstream);
    }))
    .pipe(gulp.dest('/tmp'));
});
```

## API

### stream : streamify(toBeWrap)

Take a stream or a function returning a stream to wrap an return a stream mode
 compatible stream.

## Contributing / Issues

You may want to contribute to this project, pull requests are welcome if you
 accept to publish under the MIT licence.
