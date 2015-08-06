'use strict'

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochacli: {
            all: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'tdd',
                timeout: '4000'
            }
        },
        browserify: {
            dist: {
                files: {
                    'node-xmpp-browser.js': ['lib/node-xmpp-browserify.js']
                },
                options: {
                    ignore : ['node-stringprep', 'faye-websocket', 'srv', 'dns', 'tls'],
                    alias : 'request:browser-request'
                }
            }
        }
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-mocha-cli')
    grunt.loadNpmTasks('grunt-browserify')

    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.registerTask('test', ['mochacli'])
}
