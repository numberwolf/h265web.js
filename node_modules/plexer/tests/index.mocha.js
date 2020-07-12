/* eslint max-nested-callbacks:[1] */

'use strict';

var assert = require('assert');
var Duplexer = require('../src');
var Stream = require('readable-stream');
var streamtest = require('streamtest');

describe('Duplexer', function() {

  streamtest.versions.forEach(function(version) {
    describe('for ' + version + ' streams', function() {

      describe('in binary mode', function() {

        describe('and with async streams', function() {

          it('should work with functionnal API', function(done) {

            var createDuplexStream = Duplexer;
            var readable = streamtest[version].fromChunks(['biba', 'beloola']);
            var writable = new Stream.PassThrough();
            var duplex = createDuplexStream({}, writable, readable);

            assert(duplex instanceof Duplexer);

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              done();
            }));

            streamtest[version].fromChunks(['oude', 'lali'])
              .pipe(duplex);

          });

          it('should work with POO API', function(done) {

            var readable = streamtest[version].fromChunks(['biba', 'beloola']);
            var writable = new Stream.PassThrough();
            var duplex = new Duplexer({}, writable, readable);

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              done();
            }));

            streamtest[version].fromChunks(['oude', 'lali'])
              .pipe(duplex);

          });

          it('should reemit errors', function(done) {
            var readable = new Stream.PassThrough();
            var writable = new Stream.PassThrough();
            var duplex = new Duplexer(writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              assert.equal(errorsCount, 2);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            setImmediate(function() {
              // Writing content to duplex
              duplex.write('oude');
              writable.emit('error', new Error('hip'));
              duplex.write('lali');
              duplex.end();

              // Writing content to readable
              readable.write('biba');
              readable.emit('error', new Error('hip'));
              readable.write('beloola');
              readable.end();
            });

          });

          it('should not reemit errors when option is set', function(done) {
            var readable = new Stream.PassThrough();
            var writable = new Stream.PassThrough();
            var duplex = new Duplexer({ reemitErrors: false }, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              assert.equal(errorsCount, 0);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            // Catch error events
            readable.on('error', function() {});
            writable.on('error', function() {});

            setImmediate(function() {
              // Writing content to duplex
              duplex.write('oude');
              writable.emit('error', new Error('hip'));
              duplex.write('lali');
              duplex.end();

              // Writing content to readable
              readable.write('biba');
              readable.emit('error', new Error('hip'));
              readable.write('beloola');
              readable.end();
            });

          });

        });

        describe('and with sync streams', function() {

          it('should work with functionnal API', function(done) {
            var createDuplexStream = Duplexer;
            var readable = new Stream.PassThrough();
            var writable = new Stream.PassThrough();
            var duplex = createDuplexStream({}, writable, readable);

            assert(duplex instanceof Duplexer);

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              done();
            }));

            // Writing content to duplex
            duplex.write('oude');
            duplex.write('lali');
            duplex.end();

            // Writing content to readable
            readable.write('biba');
            readable.write('beloola');
            readable.end();

          });

          it('should work with POO API', function(done) {
            var readable = new Stream.PassThrough();
            var writable = new Stream.PassThrough();
            var duplex = new Duplexer(writable, readable);

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              done();
            }));

            // Writing content to duplex
            duplex.write('oude');
            duplex.write('lali');
            duplex.end();

            // Writing content to readable
            readable.write('biba');
            readable.write('beloola');
            readable.end();

          });

          it('should reemit errors', function(done) {
            var readable = new Stream.PassThrough();
            var writable = new Stream.PassThrough();
            var duplex = new Duplexer(null, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              assert.equal(errorsCount, 2);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            // Writing content to duplex
            duplex.write('oude');
            writable.emit('error', new Error('hip'));
            duplex.write('lali');
            duplex.end();

            // Writing content to readable
            readable.write('biba');
            readable.emit('error', new Error('hip'));
            readable.write('beloola');
            readable.end();

          });

          it('should not reemit errors when option is set', function(done) {
            var readable = new Stream.PassThrough();
            var writable = new Stream.PassThrough();
            var duplex = new Duplexer({ reemitErrors: false }, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'oudelali');
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, 'bibabeloola');
              assert.equal(errorsCount, 0);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            // Catch error events
            readable.on('error', function() {});
            writable.on('error', function() {});

            // Writing content to duplex
            duplex.write('oude');
            writable.emit('error', new Error('hip'));
            duplex.write('lali');
            duplex.end();

            // Writing content to readable
            readable.write('biba');
            readable.emit('error', new Error('hip'));
            readable.write('beloola');
            readable.end();

          });

        });

      });

      describe('in object mode', function() {
        var obj1 = { cnt: 'oude' };
        var obj2 = { cnt: 'lali' };
        var obj3 = { cnt: 'biba' };
        var obj4 = { cnt: 'beloola' };

        describe('and with async streams', function() {

          it('should work with functionnal API', function(done) {

            var createDuplexStream = Duplexer;
            var readable = streamtest[version].fromObjects([obj1, obj2]);
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = createDuplexStream({ objectMode: true }, writable, readable);

            assert(duplex instanceof Duplexer);

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
              done();
            }));

            streamtest[version].fromObjects([obj3, obj4])
              .pipe(duplex);

          });

          it('should work with functionnal API', function(done) {

            var readable = streamtest[version].fromObjects([obj1, obj2]);
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = Duplexer.obj(writable, readable);

            assert(duplex instanceof Duplexer);

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
              done();
            }));

            streamtest[version].fromObjects([obj3, obj4])
              .pipe(duplex);

          });

          it('should work with POO API', function(done) {

            var readable = streamtest[version].fromObjects([obj1, obj2]);
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = new Duplexer({ objectMode: true }, writable, readable);

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
              done();
            }));

            streamtest[version].fromObjects([obj3, obj4])
              .pipe(duplex);

          });

          it('should reemit errors', function(done) {
            var readable = new Stream.PassThrough({ objectMode: true });
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = new Duplexer({ objectMode: true }, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
              assert.equal(errorsCount, 2);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            setImmediate(function() {
              // Writing content to duplex
              duplex.write(obj1);
              writable.emit('error', new Error('hip'));
              duplex.write(obj2);
              duplex.end();

              // Writing content to readable
              readable.write(obj3);
              readable.emit('error', new Error('hip'));
              readable.write(obj4);
              readable.end();
            });

          });

          it('should not reemit errors when option is set', function(done) {
            var readable = new Stream.PassThrough({ objectMode: true });
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = Duplexer.obj({ reemitErrors: false }, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
              assert.equal(errorsCount, 0);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            // Catch error events
            readable.on('error', function() {});
            writable.on('error', function() {});

            setImmediate(function() {
              // Writing content to duplex
              duplex.write(obj1);
              writable.emit('error', new Error('hip'));
              duplex.write(obj2);
              duplex.end();

              // Writing content to readable
              readable.write(obj3);
              readable.emit('error', new Error('hip'));
              readable.write(obj4);
              readable.end();
            });

          });

        });

        describe('and with sync streams', function() {

          it('should work with functionnal API', function(done) {
            var createDuplexStream = Duplexer;
            var readable = new Stream.PassThrough({ objectMode: true });
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = createDuplexStream({ objectMode: true }, writable, readable);

            assert(duplex instanceof Duplexer);

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
              done();
            }));

            // Writing content to duplex
            duplex.write(obj1);
            duplex.write(obj2);
            duplex.end();

            // Writing content to readable
            readable.write(obj3);
            readable.write(obj4);
            readable.end();

          });

          it('should work with POO API', function(done) {
            var readable = new Stream.PassThrough({ objectMode: true });
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = new Duplexer({ objectMode: true }, writable, readable);

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
              done();
            }));

            // Writing content to duplex
            duplex.write(obj1);
            duplex.write(obj2);
            duplex.end();

            // Writing content to readable
            readable.write(obj3);
            readable.write(obj4);
            readable.end();

          });

          it('should reemit errors', function(done) {
            var readable = new Stream.PassThrough({ objectMode: true });
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = new Duplexer({ objectMode: true }, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
              assert.equal(errorsCount, 2);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            // Writing content to duplex
            duplex.write(obj1);
            writable.emit('error', new Error('hip'));
            duplex.write(obj2);
            duplex.end();

            // Writing content to readable
            readable.write(obj3);
            readable.emit('error', new Error('hip'));
            readable.write(obj4);
            readable.end();

          });

          it('should not reemit errors when option is set', function(done) {
            var readable = new Stream.PassThrough({ objectMode: true });
            var writable = new Stream.PassThrough({ objectMode: true });
            var duplex = new Duplexer({
              objectMode: true,
              reemitErrors: false,
            }, writable, readable);
            var errorsCount = 0;

            // Checking writable content
            writable.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj1, obj2]);
            }));

            // Checking duplex output
            duplex.pipe(streamtest[version].toObjects(function(err, objs) {
              if(err) {
                return done(err);
              }
              assert.deepEqual(objs, [obj3, obj4]);
              assert.equal(errorsCount, 0);
              done();
            }));

            duplex.on('error', function() {
              errorsCount++;
            });

            // Catch error events
            readable.on('error', function() {});
            writable.on('error', function() {});

            // Writing content to duplex
            duplex.write(obj1);
            writable.emit('error', new Error('hip'));
            duplex.write(obj2);
            duplex.end();

            // Writing content to readable
            readable.write(obj3);
            readable.emit('error', new Error('hip'));
            readable.write(obj4);
            readable.end();

          });

        });

      });

    });
  });

});
