define(function(require) {
    "use strict";

    var configurable = require('../util/configurable');

    /**
     * Build `_parent` attribute on a tree and its children.
     * @param {tree}   tree   The root
     * @param {tree}   parent The parent to apply to the root (optionnal)
     */
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

    /**
     * Will return a tree with method to manipulate it.
     * @param  {object} data The raw tree as litteral object
     * @return {object}      A tree
     */
    return function tree (data) {

        var config = {
            // The raw data can be updated by calling `data(object d)` on the tree`.
            data: data
        };

        setParent(data);

        var model = {
            /**
             * Will find a node in the tree.
             * @param  {string} path The path of the node based on the current tree
             * @return {undefined|tree}        The node
             */
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

            /**
             * Will append a node to the tree.
             * @param  {tree} childNode The node to append
             * @return {tree}           The child node
             */
            append: function(childNode) {
                if (!config.data.children) {
                    config.data.children = [];
                }

                var childNodeData = childNode.data();
                setParent(childNodeData, config.data);
                config.data.children.push(childNodeData);

                return tree(childNodeData);
            },

            /**
             * Will remove the current tree from its parent.
             * @return {undefined|tree} The parent of the tree
             */
            remove: function() {
                if (!config.data._parent) {
                    return undefined;
                }

                var parentChildren = config.data._parent.children;
                parentChildren.splice(parentChildren.indexOf(model.data()), 1);
                config.data._parent.children = parentChildren;

                return model.parent();
            },

            /**
             * Will move the current tree to an other node.
             * @param  {tree} destNode           The future parent of the tree
             * @return {undefined|tree}          The moved tree
             */
            moveTo: function(destNode) {
                var parent = model.parent();

                if (!parent) {
                    return undefined;
                }

                parent.find('/' + config.data.name).remove();
                destNode.append(model);

                return model;
            },

            /**
             * Will return the children of the tree.
             * @return {array} The children
             */
            children: function() {
                if (!config.data.children) {
                    return [];
                }

                return config.data.children.map(function(child) {
                    return tree(child);
                });
            },

            /**
             * Will return the parent of the tree.
             * @return {undefined|tree} The parent
             */
            parent: function() {
                if (!config.data._parent) {
                    return undefined;
                }

                return tree(config.data._parent);
            },

            /**
             * Will return the path of the current node.
             * @return {string} The path
             */
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

            /**
             * Will return the name of the current node.
             * @return {string} The name
             */
            name: function() {
                return config.data.name;
            },

            /**
             * Will return or set an attribute on the current node.
             * @param  {string} key   The name of the attribute
             * @param  {mixed}  value The value of the attribute (optional)
             * @return {mixed|tree}   The value of the attribute or the current node
             */
            attr: function(key, value) {
                if (value === undefined) {
                    return config.data[key];
                }

                config.data[key] = value;

                return model;
            },

            /**
             * Will clone the current node.
             * When a node is cloned, it is extract from the current tree scope
             * and become detached from its parent. That means calling `parent()`
             * will return undefined.
             * @return {tree} The cloned node
             */
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
            },

            /**
             * Will return the tree factory
             * @return Function
             */
            factory: function() {
                return tree;
            },

            /**
             * Will return a visitor to execute a callback on each node
             * @return {Function} The visitor
             */
            visitor: function() {
                return function (cb) {
                    var search = function (rootTree) {
                        if (rootTree.children) {
                            for (var child in rootTree.children) {
                                if (rootTree.children.hasOwnProperty(child) &&
                                    rootTree.children[child]) {
                                    search(rootTree.children[child]);
                                }
                            }
                        }

                        cb(tree(rootTree));
                    };

                    search(config.data);
                };
            }
        };

        configurable(model, config);

        return model;
    };
});
