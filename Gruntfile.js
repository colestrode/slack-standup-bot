module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  require('time-grunt')(grunt);
  grunt.option('reporter', grunt.option('reporter') || 'spec');

  grunt.initConfig({
    coveralls: {
      options: {
        force: true
      },
      grunt_coveralls_coverage: {
        src: 'coverage/lcov.info'
      }
    },
    jscs: {
      src: [
        'controller/**/*.js',
        'model/**/*.js',
        'lib/**/*.js',
        'test/**/*.js',
        '!test/reports/**/*.js',
        '*.js'
      ]
    },
    jshint: {
      files: [
        'controller/**/*.js',
        'model/**/*.js',
        'lib/**/*.js',
        'test/**/*.js',
        '!test/reports/**/*.js',
        '*.js'
      ],
      options: {
        jshintrc: './.jshintrc',
        ignores: ['Gruntfile.js']
      }
    },
    shell: {
      test: {
        command: './node_modules/.bin/istanbul cover --report lcov --dir ./coverage/ ./node_modules/.bin/_mocha --recursive ./test --grep ./test/**/*.spec.js -- --colors --reporter <%= grunt.option("reporter") %> <%= grunt.option("bail") && " --bail" %>',
        options: {
          stdout: true,
          failOnError: true
        }
      }
    }
  });

  grunt.registerTask('lint', [
    'jshint',
    'jscs'
  ]);

  grunt.registerTask('test', ['lint', 'shell:test']);

  grunt.registerTask('ci', ['test', 'coveralls:grunt_coveralls_coverage']);

  grunt.registerTask('default', 'test');
};
