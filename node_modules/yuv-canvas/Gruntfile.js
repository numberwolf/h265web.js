
module.exports = function(grunt) {

  function stringify(filename) {
    return JSON.stringify(require('fs').readFileSync(filename, 'utf8'));
  }
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      options: {
      },
      target: 'src/*.js'
    },
    replace: {
      shaders: {
        src: ['src/shaders.js.in'],
        dest: ['build/shaders.js'],
        replacements: [{
          from: 'YCBCR_VERTEX_SHADER',
          to: stringify('./shaders/YCbCr.vsh')
        }, {
          from: 'YCBCR_FRAGMENT_SHADER',
          to: stringify('./shaders/YCbCr.fsh')
        }, {
          from: 'YCBCR_STRIPE_VERTEX_SHADER',
          to: stringify('./shaders/unpack-stripe.vsh')
        }, {
          from: 'YCBCR_STRIPE_FRAGMENT_SHADER',
          to: stringify('./shaders/unpack-stripe.fsh')
        }]
      }
    },
    browserify: {
      demo: {
        files: {
          'docs/demo-bundled.js': ['docs/demo.js']
        },
        options: {
          transform: [[require('aliasify'), {
            aliases: {
              'yuv-canvas': './src/yuv-canvas.js'
            }
          }]]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['eslint', 'replace', 'browserify']);

};
