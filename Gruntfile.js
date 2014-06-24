'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            allFiles: ['gruntfile.js', 'lib/**/*.js', 'examples/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
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
                timeout: 60000
            }
        }
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')

    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.registerTask('test', ['mochacli:unit', 'jshint'])
    grunt.registerTask('integration-test', ['mochacli', 'jshint' ])
}
