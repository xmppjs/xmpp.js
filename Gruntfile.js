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
            all: ['test/**/*.js', 'node_modules/node-xmpp-*/test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'tdd'
            }
        },
        browserify: {
            dist: {
                files: {
                    'node-xmpp-browser.js': ['lib/node-xmpp-browserify.js'],
                },
                options: {
                    ignore : ['node-stringprep', 'faye-websocket', 'srv', 'dns', 'tls'],
                    alias : 'request:browser-request'
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
