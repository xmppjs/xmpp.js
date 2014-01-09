'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            allFiles: ['gruntfile.js', 'lib/**/*.js', 'examples/**/*.js', 'test/**/*.js'],
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
                options: {
                    alias : 'request:browser-request',
                    ignore : ['node-stringprep', 'faye-websocket', './srv', 'dns', 'tls']
                }
            }
        },
        connect: {
            target: {
                options: {
                    keepalive: false
                }
            }
        },
        clean: ['node-xmpp-browser.js'],
        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['browserify', 'connect'],
                options: {
                    spawn: false,
                },
            },
            connect: {
                files: ['**/*.js']
            }
        }
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')
    grunt.loadNpmTasks('grunt-browserify')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-watch')

    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.registerTask('test', ['clean', 'mochacli', 'browserify', 'jshint'])
    grunt.registerTask('dev', ['browserify', 'connect', 'watch'])
}
