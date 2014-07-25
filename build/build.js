({
    baseUrl: "../src",
    name: "../almond.js",
    include: ['model/tree'],
    insertRequire: ['model/tree'],
    wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
    },
    out: '../tree.min.js'
})
