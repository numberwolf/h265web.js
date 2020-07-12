/* eslint max-nested-callbacks:[1] */

'use strict';

var gStreamify = require('../');
var Stream = require('stream');
var streamtest = require('streamtest');
var gutil = require('gulp-util');
var assert = require('assert');

describe('gulp-streamify', function() {

  // Simple plugin appending test to contents for test purposes
  function pluginFunction() {
    var pluginStream = new Stream.Transform({ objectMode: true });

    pluginStream._transform = function(file, unused, cb) {
      assert(file.contents instanceof Buffer);
      file.contents = Buffer.concat([file.contents, new Buffer('test')]);
      pluginStream.push(file);
      cb();
    };
    return pluginStream;
  }

  streamtest.versions.forEach(function(version) {

    describe('for ' + version + ' streams', function() {

      it('should pass null files through', function(done) {

        gStreamify(streamtest[version].fromObjects([
          new gutil.File({
            cwd: '/home/nfroidure/',
            base: '/home/nfroidure/test',
            path: '/home/nfroidure/test/file.js',
            contents: null,
          }),
          new gutil.File({
            cwd: '/home/nfroidure/',
            base: '/home/nfroidure/test',
            path: '/home/nfroidure/test/file2.js',
            contents: null,
          }),
        ])).pipe(streamtest[version].toObjects(function(err, objs) {
          if(err) {
            return done(err);
          }
          assert.equal(objs.length, 2);
          done();
        }));

      });

      it('should reemit errors', function(done) {

        var passStream = new Stream.PassThrough({ objectMode: true });
        var stream = gStreamify(passStream);
        var inputError = new Error('ich bin ein error');

        stream.on('error', function(error) {
          assert.equal(error, inputError);
          done();
        });

        passStream.emit('error', inputError);

      });

      describe('in stream mode', function() {

        it('should work with sync streams and sync contents', function(done) {

          var pluginStream = pluginFunction();
          var inputStream = new Stream.PassThrough({ objectMode: true });
          var fakeFile = new gutil.File({
            cwd: '/home/nfroidure/',
            base: '/home/nfroidure/test',
            path: '/home/nfroidure/test/file.js',
            contents: new Stream.PassThrough(),
          });
          var fakeFile2 = new gutil.File({
            cwd: '/home/nfroidure/',
            base: '/home/nfroidure/test',
            path: '/home/nfroidure/test/file2.js',
            contents: new Stream.PassThrough(),
          });

          inputStream
            .pipe(gStreamify(pluginStream))
            .pipe(streamtest[version].toObjects(function(err, files) {
              if(err) {
                return done(err);
              }
              assert.equal(files.length, 2);
              assert.equal(files[0].cwd, '/home/nfroidure/');
              assert.equal(files[0].base, '/home/nfroidure/test');
              assert.equal(files[0].path, '/home/nfroidure/test/file.js');
              assert.equal(files[1].cwd, '/home/nfroidure/');
              assert.equal(files[1].base, '/home/nfroidure/test');
              assert.equal(files[1].path, '/home/nfroidure/test/file2.js');
              files[0].pipe(streamtest[version].toText(function(err2, text) {
                if(err2) {
                  return done(err2);
                }
                assert.equal(text, 'plipplaptest');
                files[1].pipe(streamtest[version].toText(function(err3, text2) {
                  if(err3) {
                    return done(err3);
                  }
                  assert.equal(text2, 'ploppluptest');
                  done();
                }));
              }));
            }));

          inputStream.write(fakeFile);
          inputStream.write(fakeFile2);
          inputStream.end();

          fakeFile.contents.write('plip');
          fakeFile.contents.write('plap');
          fakeFile.contents.end();

          fakeFile2.contents.write('plop');
          fakeFile2.contents.write('plup');
          fakeFile2.contents.end();

        });

        it('should work with sync streams and async contents', function(done) {

          var pluginStream = pluginFunction();

          var inputStream = new Stream.PassThrough({ objectMode: true });
          var fakeFile = new gutil.File({
            cwd: '/home/nfroidure/',
            base: '/home/nfroidure/test',
            path: '/home/nfroidure/test/file.js',
            contents: streamtest.v2.fromChunks(['plip', 'plap']),
          });
          var fakeFile2 = new gutil.File({
            cwd: '/home/nfroidure/',
            base: '/home/nfroidure/test',
            path: '/home/nfroidure/test/file2.js',
            contents: streamtest.v2.fromChunks(['plop', 'plup']),
          });

          inputStream
            .pipe(gStreamify(pluginStream))
            .pipe(streamtest[version].toObjects(function(err, files) {
              if(err) {
                return done(err);
              }
              assert.equal(files.length, 2);
              assert.equal(files[0].cwd, '/home/nfroidure/');
              assert.equal(files[0].base, '/home/nfroidure/test');
              assert.equal(files[0].path, '/home/nfroidure/test/file.js');
              assert.equal(files[1].cwd, '/home/nfroidure/');
              assert.equal(files[1].base, '/home/nfroidure/test');
              assert.equal(files[1].path, '/home/nfroidure/test/file2.js');
              files[0].pipe(streamtest[version].toText(function(err2, text) {
                if(err2) {
                  return done(err2);
                }
                assert.equal(text, 'plipplaptest');
                files[1].pipe(streamtest[version].toText(function(err3, text2) {
                  if(err3) {
                    return done(err3);
                  }
                  assert.equal(text2, 'ploppluptest');
                  done();
                }));
              }));
            }));

          inputStream.write(fakeFile);
          inputStream.write(fakeFile2);
          inputStream.end();

        });

        it('should work with async streams and async contents', function(done) {

          var pluginStream = pluginFunction();

          streamtest[version].fromObjects([
            new gutil.File({
              cwd: '/home/nfroidure/',
              base: '/home/nfroidure/test',
              path: '/home/nfroidure/test/file.js',
              contents: streamtest.v2.fromChunks(['plip', 'plap']),
            }),
            new gutil.File({
              cwd: '/home/nfroidure/',
              base: '/home/nfroidure/test',
              path: '/home/nfroidure/test/file2.js',
              contents: streamtest.v2.fromChunks(['plip', 'plup']),
            }),
          ])
          .pipe(gStreamify(pluginStream))
          .pipe(streamtest[version].toObjects(function(err, files) {
            if(err) {
              return done(err);
            }
            assert.equal(files.length, 2);
            assert.equal(files[0].cwd, '/home/nfroidure/');
            assert.equal(files[0].base, '/home/nfroidure/test');
            assert.equal(files[0].path, '/home/nfroidure/test/file.js');
            assert.equal(files[1].cwd, '/home/nfroidure/');
            assert.equal(files[1].base, '/home/nfroidure/test');
            assert.equal(files[1].path, '/home/nfroidure/test/file2.js');
            files[0].pipe(streamtest[version].toText(function(err2, text) {
              if(err2) {
                return done(err2);
              }
              assert.equal(text, 'plipplaptest');
              files[1].pipe(streamtest[version].toText(function(err3, text2) {
                if(err3) {
                  return done(err3);
                }
                assert.equal(text2, 'plippluptest');
                done();
              }));
            }));
          }));

        });

        it('should work with plugin function provinding async files streams', function(done) {

          streamtest[version].fromObjects([
            new gutil.File({
              cwd: '/home/nfroidure/',
              base: '/home/nfroidure/test',
              path: '/home/nfroidure/test/file.js',
              contents: streamtest.v2.fromChunks(['plip', 'plap']),
            }),
            new gutil.File({
              cwd: '/home/nfroidure/',
              base: '/home/nfroidure/test',
              path: '/home/nfroidure/test/file2.js',
              contents: streamtest.v2.fromChunks(['plip', 'plup']),
            }),
          ])
          .pipe(gStreamify(pluginFunction))
          .pipe(streamtest[version].toObjects(function(err, files) {
            if(err) {
              return done(err);
            }
            assert.equal(files.length, 2);
            assert.equal(files[0].cwd, '/home/nfroidure/');
            assert.equal(files[0].base, '/home/nfroidure/test');
            assert.equal(files[0].path, '/home/nfroidure/test/file.js');
            assert.equal(files[1].cwd, '/home/nfroidure/');
            assert.equal(files[1].base, '/home/nfroidure/test');
            assert.equal(files[1].path, '/home/nfroidure/test/file2.js');
            files[0].pipe(streamtest[version].toText(function(err2, text) {
              if(err2) {
                return done(err2);
              }
              assert.equal(text, 'plipplaptest');
              files[1].pipe(streamtest[version].toText(function(err3, text2) {
                if(err3) {
                  return done(err3);
                }
                assert.equal(text2, 'plippluptest');
                done();
              }));
            }));
          }));

        });

      });

      describe('in buffer mode', function() {

        it('should work', function(done) {

          var pluginStream = pluginFunction();

          streamtest[version].fromObjects([
            new gutil.File({
              cwd: '/home/nfroidure/',
              base: '/home/nfroidure/test',
              path: '/home/nfroidure/test/file.js',
              contents: new Buffer('plipplap'),
            }),
            new gutil.File({
              cwd: '/home/nfroidure/',
              base: '/home/nfroidure/test',
              path: '/home/nfroidure/test/file2.js',
              contents: new Buffer('plipplup'),
            }),
          ])
          .pipe(gStreamify(pluginStream))
          .pipe(streamtest[version].toObjects(function(err, files) {
            if(err) {
              return done(err);
            }
            assert.equal(files.length, 2);
            assert.equal(files[0].cwd, '/home/nfroidure/');
            assert.equal(files[0].base, '/home/nfroidure/test');
            assert(files[0].contents instanceof Buffer);
            assert.equal(files[0].path, '/home/nfroidure/test/file.js');
            assert.equal(files[0].contents.toString(), 'plipplaptest');
            assert.equal(files[1].cwd, '/home/nfroidure/');
            assert.equal(files[1].base, '/home/nfroidure/test');
            assert(files[1].contents instanceof Buffer);
            assert.equal(files[1].path, '/home/nfroidure/test/file2.js');
            assert.equal(files[1].contents.toString(), 'plippluptest');
            done();
          }));

        });

      });

    });

  });

});
