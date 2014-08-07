define(function(require) {
    "use strict";

    var tree     = require('model/tree'),
        hookable = require('model/hookable');

    function Tree() {

    }

    Tree.prototype.tree = tree;

    Tree.prototype.hookable = hookable;

    return Tree;
});
