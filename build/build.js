({
    baseUrl: "../src",
    name: "../almond.js",
    include: ['main'],
    insertRequire: ['main'],
    wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
    },
    out: '../tree.min.js'
})
