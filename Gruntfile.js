'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            allFiles: ['*.js', 'lib/**/*.js', 'examples/**/*.js', 'test/**/*.js'],
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
        'mocha_istanbul': {
            coveralls: {
                src: 'test',
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
    
    grunt.event.on('coverage', function(lcov, done){
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
    grunt.loadNpmTasks('grunt-mocha-istanbul')

    // Configure tasks
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
    grunt.registerTask('default', ['test'])
    grunt.registerTask('test', ['mochacli', 'jshint', 'coveralls'])
}
