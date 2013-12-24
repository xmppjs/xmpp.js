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
                    'node-xmpp-browser.js': ['./browserify.js'],
                },
                alias : 'request:browser-request',
                options: {
                    ignore : ['node-stringprep', 'faye-websocket', './srv', 'dns', 'tls']
                }
            }
        },
        connect: {
            target: {
                options: {
                    keepalive: true
                }
            }
        },
        clean: ['node-xmpp-browser.js']
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')
    grunt.loadNpmTasks('grunt-browserify')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-contrib-clean')

    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.registerTask('test', ['clean', 'mochacli', 'browserify', 'jshint'])
}
