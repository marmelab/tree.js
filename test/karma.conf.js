module.exports = function (config) {
    "use strict";

    config.set({
        basePath: '../',
        browsers: [process.env.CI ? 'PhantomJS' : 'Chrome'],
        files: [
            {pattern: 'src/**/*.js', included: false},

            // test files
            {pattern: 'test/src/**/*.js', included: false},

            {pattern: 'bower_components/q/q.js', included: false},

            'test/main-test.js'
        ],
        frameworks: ['requirejs', 'jasmine'],
    });
};
