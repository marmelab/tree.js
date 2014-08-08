module.exports = function (config) {
    "use strict";

    config.set({
        basePath: '../',
        browsers: [process.env.CI ? 'PhantomJS' : 'Chrome'],
        files: [
            //{pattern: 'src/**/*.js', included: false},
            {pattern: 'tree.min.js', included: true},
            {pattern: 'bower_components/q/q.js', included: true},

            // test files
            {pattern: 'test/src/**/*.js', included: true},

            //'test/main-test.js'
        ],
        frameworks: ['jasmine'],
    });
};
