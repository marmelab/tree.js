({
    baseUrl: "../src",
    name: "../bower_components/almond/almond.js",
    include: ['main'],
    insertRequire: ['main'],
    wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
    },
    out: '../tree.min.js'
})
