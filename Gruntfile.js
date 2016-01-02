module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  require('time-grunt')(grunt);
  grunt.option('reporter', grunt.option('reporter') || 'spec');

  grunt.initConfig({
    jscs: {
      src: [
        'controller/**/*.js',
        'model/**/*.js',
        'lib/**/*.js',
        '*.js'
      ]
    },
    jshint: {
      files: [
        'controller/**/*.js',
        'model/**/*.js',
        'lib/**/*.js',
        '*.js'
      ],
      options: {
        jshintrc: './.jshintrc',
        ignores: ['Gruntfile.js']
      }
    },
    shell: {
      test: {
        command: './node_modules/.bin/istanbul cover --report lcov --dir test/reports/ ./node_modules/.bin/_mocha --recursive ./test --grep ./test/**/*.spec.js -- --colors --reporter <%= grunt.option("reporter") %> <%= grunt.option("bail") && " --bail" %>',
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
};
