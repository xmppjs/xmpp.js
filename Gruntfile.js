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
        browserify: {
            dist: {
                files: {
                    'node-xmpp-browser.js': ['./browserify.js'],
                },
                options: {
                    alias : 'request:browser-request',
                    ignore : ['faye-websocket', './srv', 'dns', 'tls']
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
        },
        'mocha_istanbul': {
            coveralls: {
                src: 'test/unit',
                options: {
                    coverage: true,
                    legend: true,
                    /* check: {
                        lines: 90,
                        statements: 90
                    }, */
                    root: './lib',
                    reportFormats: [ 'lcov', 'html' ]
                }
            }
        }
    })
    
    grunt.event.on('coverage', function(lcov, done) {
        require('coveralls').handleInput(lcov, function(error) {
            if (error) {
                console.log(error)
                return done(error)
            }
            done()
        })
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')
    grunt.loadNpmTasks('grunt-browserify')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-mocha-istanbul')

    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
    grunt.registerTask('test', ['clean', 'mochacli:unit', 'browserify', 'jshint', 'coveralls' ])
    grunt.registerTask('integration-test', ['mochacli', 'jshint' ])
    grunt.registerTask('dev', ['browserify', 'connect', 'watch'])
}
