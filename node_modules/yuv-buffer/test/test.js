var YUVBuffer = require('../yuv-buffer.js'),
  assert = require('assert'),
  expect = require('chai').expect;

describe('YUVBuffer', function() {
  describe('#validateDimension', function() {
    context('when a valid positive integer', function() {
      it('should pass through input without throwing', function() {
        [1, 2, 100, 10000].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateDimension(sample);
          }).to.not.throw();
        });
      });
    });
    context('when 0 or a negative integer', function() {
      it('should throw', function() {
        [0, -1, -2, -100, -10000].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateDimension(sample);
          }).to.throw();
        });
      });
    });
    context('when non-integer-safe numbers', function() {
      it('should throw', function() {
        [0.5, -2.3, Math.PI, 2e56, Infinity, -Infinity, NaN].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateDimension(sample);
          }).to.throw();
        });
      });
    });
    context('when not even a number', function() {
      it('should throw', function() {
        [null, undefined, "barf", "24", {}, []].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateDimension(sample);
          }).to.throw();
        });
      });
    });
  }),
  describe('#validateOffset', function() {
    context('when a valid non-negative integer', function() {
      it('should pass through input without throwing', function() {
        [0, 1, 2, 100, 10000].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateOffset(sample);
          }).to.not.throw();
        });
      });
    });
    context('when a negative integer', function() {
      it('should throw', function() {
        [-1, -2, -100, -10000].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateOffset(sample);
          }).to.throw();
        });
      });
    });
    context('when non-integer-safe numbers', function() {
      it('should throw', function() {
        [0.5, -2.3, Math.PI, 2e56, Infinity, -Infinity, NaN].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateOffset(sample);
          }).to.throw();
        });
      });
    });
    context('when not even a number', function() {
      it('should throw', function() {
        [null, undefined, "barf", "24", {}, []].forEach(function(sample) {
          expect(function() {
            YUVBuffer.validateOffset(sample);
          }).to.throw();
        });
      });
    });
  }),
  describe('#suitableStride()', function() {
    context('for multiples of 4', function() {
      it('should return identity for multiples of 4', function() {
        [4, 8, 12, 16, 720, 1920, 3840].forEach(function(sample) {
          assert(YUVBuffer.suitableStride(sample) === sample);
        });
      });
    });
    context('for non-multiples of 4', function() {
      it('should return next mult of 4', function() {
        [[1, 4], [2, 4], [3, 4], [5, 8], [999, 1000]].forEach(function(sample) {
          var input = sample[0],
            output = sample[1];
          assert(YUVBuffer.suitableStride(input) === output);
        });
      });
    });
  });
  describe('#format()', function() {
    context('when given invalid data', function() {
      it('should throw when width or height missing', function() {
        expect(function() {
          YUVBuffer.format({});
        }).to.throw();
        expect(function() {
          YUVBuffer.format({width: 200});
        }).to.throw();
        expect(function() {
          YUVBuffer.format({height: 100});
        }).to.throw();
        expect(function() {
          YUVBuffer.format({width: 200, height: 100});
        }).to.not.throw();
      });
    });
    context('when given partial data', function() {
      it('should expand input', function() {
        var input = {
          width: 1920,
          height: 1088,
          chromaWidth: 1920 / 2,
          chromaHeight: 1088 / 2,
          cropHeight: 1080
        }, output = {
          width: 1920,
          height: 1088,
          chromaWidth: 960,
          chromaHeight: 544,
          cropLeft: 0, // default
          cropTop: 0, // default
          cropWidth: 1920, // derived from width
          cropHeight: 1080,
          displayWidth: 1920, // derived from width via cropWidth
          displayHeight: 1080 // derived from cropHeight
        };
        assert.deepEqual(YUVBuffer.format(input), output);
      });
    });
  });
  context('planar functions', function() {
    var anamorphic = YUVBuffer.format({
      width: 720, // can have stride == width
      height: 480,
      chromaWidth: 720 / 2,
      chromaHeight: 480 / 2,
      displayWidth: 853,
    });
    var square = YUVBuffer.format({
      width: 854, // not 1/4-even number of pixels!
      height: 480,
      chromaWidth: 854 / 2,
      chromaHeight: 480 / 2,
      cropWidth: 853
    });
    function planeTest(plane, width, height) {
      context('for ' + width + 'x' + height, function() {
        it('should return expected format', function() {
          assert(plane.bytes instanceof Uint8Array);
          assert(typeof plane.stride === 'number');
        });
        it('should return expected size', function() {
          assert(plane.bytes.length === plane.stride * height)
        });
        it('should return stride >= width', function() {
          assert(plane.stride >= width);
        });
        it('should return a stride multiple of 4', function() {
          assert(plane.stride % 4 === 0);
        });
      });
      return plane;
    }
    describe('#allocPlane()', function() {
      context('when given just a size', function() {
        function alloc(format) {
          return YUVBuffer.allocPlane(format.width, format.height);
        }
        planeTest(alloc(anamorphic), anamorphic.width, anamorphic.height);
        planeTest(alloc(square), square.width, square.height);
      });
      context('when given a size and source', function() {
        function alloc(format) {
          var heap = new Uint8Array(8 * 1024 * 1024),
            offset = 999,
            stride = YUVBuffer.suitableStride(format.width);
          return YUVBuffer.allocPlane(format.width, format.height, heap, stride, offset);
        }
        planeTest(alloc(anamorphic), anamorphic.width, anamorphic.height);
        planeTest(alloc(square), square.width, square.height);
      });
    });
    describe('#lumaPlane()', function() {
      context('when given just a format', function() {
        function alloc(format) {
          return YUVBuffer.lumaPlane(format);
        }
        planeTest(alloc(anamorphic), anamorphic.width, anamorphic.height);
        planeTest(alloc(square), square.width, square.height);
      });
      context('when given a format and source', function() {
        function alloc(format) {
          var heap = new Uint8Array(8 * 1024 * 1024),
            offset = 999,
            stride = YUVBuffer.suitableStride(format.width);
          return YUVBuffer.lumaPlane(format, heap, stride, offset);
        }
        planeTest(alloc(anamorphic), anamorphic.width, anamorphic.height);
        planeTest(alloc(square), square.width, square.height);
      });
    });
    describe('#chromaPlane()', function() {
      context('when given just a format', function() {
        function alloc(format) {
          return YUVBuffer.chromaPlane(format);
        }
        planeTest(alloc(anamorphic), anamorphic.chromaWidth, anamorphic.chromaHeight);
        planeTest(alloc(square), square.chromaWidth, square.chromaHeight);
      });
      context('when given a format and source', function() {
        function alloc(format) {
          var heap = new Uint8Array(8 * 1024 * 1024),
            offset = 999,
            stride = YUVBuffer.suitableStride(format.width);
          return YUVBuffer.chromaPlane(format, heap, stride, offset);
        }
        planeTest(alloc(anamorphic), anamorphic.chromaWidth, anamorphic.chromaHeight);
        planeTest(alloc(square), square.chromaWidth, square.chromaHeight);
      });
    });
  });
});
