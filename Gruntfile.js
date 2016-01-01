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
    }
  });

  grunt.registerTask('lint', [
    'jshint',
    'jscs'
  ]);

  grunt.registerTask('test', ['lint']);
};
