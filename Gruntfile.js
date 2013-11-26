'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            allFiles: ['gruntfile.js', 'lib/**/*.js', 'examples/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
            }
        },
        mochacli: {
            all: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'tdd'
            }
        },
        browserify: {
            dist: {
                files: {
                    'node-xmpp-browser.js': ['browserify.js'],
                },
                ignore : ['node-stringprep', 'faye-websocket', 'srv', 'dns'],
                alias : 'request:browser-request',
                options: {
                }
            }
        }
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')
    grunt.loadNpmTasks('grunt-browserify')

    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.registerTask('test', ['mochacli', 'jshint'])
}
