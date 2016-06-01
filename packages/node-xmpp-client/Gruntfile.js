'use strict'

var helper = require('./test/helper')

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochacli: {
      unit: {
        options: { files: [ './test/unit/**/*.js' ] }
      },
      integration: {
        options: { files: [ './test/integration/**/*.js' ] }
      },
      options: {
        reporter: 'spec',
        ui: 'tdd',
        timeout: 10000
      }
    },
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
  grunt.loadNpmTasks('grunt-mocha-cli')
  grunt.loadNpmTasks('grunt-mocha-phantomjs')
  grunt.loadNpmTasks('grunt-contrib-connect')

  // Configure tasks
  grunt.registerTask('default', ['test'])
  grunt.registerTask('test', ['mochacli:unit'])
  grunt.registerTask('integration-test', ['mochacli:integration', 'test'])
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
