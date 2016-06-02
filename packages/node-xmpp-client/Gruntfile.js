'use strict'

var helper = require('./test/helper')

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mocha_phantomjs: {
      all: ['test/browser/**/*.html']
    },
    connect: {
      server: {
        options: {
          port: 8000,
          base: '.'
        },
        target: {
          options: {
            keepalive: false
          }
        }
      }
    }
  })

  // Load the plugins
  grunt.loadNpmTasks('grunt-mocha-phantomjs')
  grunt.loadNpmTasks('grunt-contrib-connect')

  // Configure tasks
  grunt.registerTask('default', ['test'])
  grunt.registerTask('integration-test', ['test'])
  grunt.registerTask('browser-test', ['connect', 'prosody-start', 'mocha_phantomjs', 'prosody-stop'])
  grunt.registerTask('full-test', ['test', 'integration-test', 'browser-test'])
  grunt.registerTask('dev', ['connect'])

  grunt.registerTask('prosody-start', 'Start Prosody', function () {
    helper.startServer(this.async())
  })
  grunt.registerTask('prosody-stop', 'Stop Prosody', function () {
    helper.stopServer(this.async())
  })
}
