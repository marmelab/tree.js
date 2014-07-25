define(function(require) {
    "use strict";

    var configurable = require('../util/configurable');

    function setParent(tree, parent) {
        var search = function(node, parent) {
            if (parent) {
                node._parent = parent;
            }

            if (node.children && node.children.length > 0) {
                for (var i in node.children) {
                    if (node.children.hasOwnProperty(i)) {
                        search(node.children[i], node);
                    }
                }
            }
        };

        search(tree, parent);
    }

    return function tree (data) {

        var config = {
            data: data
        };

        setParent(data);

        var model = {
            find: function(path) {
                var search = function (target, rootTree) {
                    if(target.length > 0) {
                        if (rootTree.children) {
                            // we did not reach the wanted node
                            for (var child in rootTree.children) {
                                if (rootTree.children.hasOwnProperty(child) &&
                                    rootTree.children[child] &&
                                    target[0] === rootTree.children[child].name) {
                                    target.shift();
                                    // we found the children which is on the path of the wanted node, we restart a search in it
                                    return search(target,rootTree.children[child]);
                                }
                            }
                        }
                        // no node found
                        return undefined;
                    }
                    // finally found the wanted node
                    return tree(rootTree);
                };

                // build target array
                // if path is /path/of/node, target will contains ['path', 'of', 'node']
                var target = path.split('/');
                if (path === '/') {
                    target = [];
                } else {
                    target.shift();
                }

                return search(target, config.data);
            },

            append: function(childNode) {
                if (!config.data.children) {
                    config.data.children = [];
                }

                var childNodeData = childNode.data();
                setParent(childNodeData, config.data);
                config.data.children.push(childNodeData);

                return tree(childNodeData);
            },

            remove: function() {
                if (!config.data._parent) {
                    return undefined;
                }

                var parentChildren = config.data._parent.children;
                parentChildren.splice(parentChildren.indexOf(model.data()), 1);
                config.data._parent.children = parentChildren;

                return model.parent();
            },

            moveTo: function(destNode) {
                var parent = model.parent();

                if (!parent) {
                    return undefined;
                }

                parent.find('/' + config.data.name).remove();
                destNode.append(model);

                return model;
            },

            children: function() {
                if (!config.data.children) {
                    return [];
                }

                return config.data.children.map(function(child) {
                    return tree(child);
                });
            },

            parent: function(parent) {
                if (!config.data._parent) {
                    return undefined;
                }

                return tree(config.data._parent);
            },

            path: function() {
                var path = config.data._parent ? [config.data.name] : [];
                var search = function(node) {
                    if (node._parent && node._parent._parent) {
                        path.unshift(node._parent.name);
                        search(node._parent);
                    }
                };
                search(config.data);
                return '/' + path.join('/');
            },

            name: function() {
                return config.data.name;
            },

            attr: function(key, value) {
                if (!value) {
                    return config.data[key];
                }

                config.data[key] = value;

                return model;
            },

            clone: function() {
                var clone = function(node) {
                    return tree(JSON.parse(JSON.stringify(node, function (key, value) {
                        if (key === '_parent') {
                            return undefined;
                        }
                        return value;
                    })));
                };

                var copy = clone(config.data);

                setParent(copy);

                return copy;
            }
        };

        configurable(model, config);

        return model;
    };
});
