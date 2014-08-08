define(function(require) {
    "use strict";

    var configurable = require('../util/configurable');

    /**
     * Will add hook events on a tree
     * @param  {tree}   tree           The tree
     * @param  {object} listeners      The default listeners
     * @param  {mixed}  promiseFactory The promise factory to use, default to Q
     * @return {object}                A hookable tree
     */
    return function hookable (tree, listeners, promiseFactory) {

        var config = {
            // By default we use Q library to handle promise but it can be
            // changed by calling `promiseFactory(mixed newPromiseFactory)`
            promiseFactory: promiseFactory || window.Q
        };

        listeners = listeners || {};

        /**
         * Will call a method on the wrapped tree with some arguments
         * @param  {string} methodName The method to call
         * @param  {array}  args       The arguments
         * @return {mixed}             The result from the tree method
         */
        function call(methodName, args) {
            args = args || [];
            return tree[methodName].apply(tree, args);
        }

        /**
         * Build an error handler for promises returned by `dispatch`
         * @param  {string} hook The hook event
         * @return {Function}    The error handler
         */
        function errorHandlerFactory(hook) {
            /**
             * Error handler which called a hook before building a rejected promise
             * @param  {mixed} err The error
             * @return {promise}   A rejected promise
             */
            return function(err) {
                return dispatch(hook).then(function() {
                    return config.promiseFactory.reject(err);
                });
            };
        }

        var model = {
            /**
             * Triggered before an append
             * @type {Number}
             */
            HOOK_PRE_APPEND:   0,

            /**
             * Triggered after an append
             * @type {Number}
             */
            HOOK_POST_APPEND:  1,

            /**
             * Triggered if an error occured during an append
             * @type {Number}
             */
            HOOK_ERROR_APPEND: 2,

            /**
             * Triggered before a remove
             * @type {Number}
             */
            HOOK_PRE_REMOVE:   10,

            /**
             * Triggered after a remove
             * @type {Number}
             */
            HOOK_POST_REMOVE:  11,

            /**
             * Triggered if an error occured during a remove
             * @type {Number}
             */
            HOOK_ERROR_REMOVE: 12,

            /**
             * Triggered before a move
             * @type {Number}
             */
            HOOK_PRE_MOVE:     20,

            /**
             * Triggered after a move
             * @type {Number}
             */
            HOOK_POST_MOVE:    21,

            /**
             * Triggered if an error occured during a move
             * @type {Number}
             */
            HOOK_ERROR_MOVE:   22,

            /**
             * Triggered before a clone
             * @type {Number}
             */
            HOOK_PRE_CLONE:    30,

            /**
             * Triggered after a clone
             * @type {Number}
             */
            HOOK_POST_CLONE:   31,

            /**
             * Triggered if an error occured during a clone
             * @type {Number}
             */
            HOOK_ERROR_CLONE:  32,

            /**
             * Will register a hook listener for a specific hook
             * @param {string}   hook The hook event
             * @param {Function} callback The listener
             */
            registerListener: function(hook, callback) {
                if (!listeners[hook]) {
                    listeners[hook] = [];
                }

                listeners[hook].push(callback);
            },

            /**
             * Simple proxy for `data` method on the wrapped tree
             * @return {array} The children of the tree
             */
            data: function(d) {
                return call('data', d ? [d]: []);
            },

            /**
             * Simple proxy for `find` method on the wrapped tree
             * @param {string} path     The node path
             * @return {mixed|hookable} The found node
             */
            find: function(path) {
                var result = call('find', [path]);

                return result ? hookable(result, listeners, config.promiseFactory) : result;
            },

             /**
             * Hookable proxy for `append` method on the wrapped tree
             * @param {tree} childNode The child node to append
             * @return {promise}       A promise which is resolved if all gone without error, rejected otherwise.
             */
            append: function(childNode) {
                return dispatch(model.HOOK_PRE_APPEND, [childNode])
                    .then(function() {
                        if (typeof(childNode.tree) === "function" && typeof(childNode.listeners) === "function") {
                            // That means childNode is a hookable tree and not just a tree
                            // We must keep its listeners
                            var childNodeListeners = childNode.listeners();
                            for (var i in childNodeListeners) {
                                if (childNodeListeners.hasOwnProperty(i)) {
                                    for (var j in childNodeListeners[i]) {
                                        if (childNodeListeners[i].hasOwnProperty(j)) {
                                            model.registerListener(i, childNodeListeners[i][j]);
                                        }
                                    }
                                }
                            }
                            return call('append', [childNode.tree()]);
                        }
                        return call('append', [childNode]);
                    })
                    .then(function(result) {
                        return dispatch(model.HOOK_POST_APPEND, [childNode]).then(function() {
                            return hookable(result, listeners, config.promiseFactory);
                        });
                    })
                    .catch(errorHandlerFactory(model.HOOK_ERROR_APPEND));
            },

             /**
             * Hookable proxy for `remove` method on the wrapped tree
             * @return {promise} A promise which is resolved if all gone without error, rejected otherwise.
             */
            remove: function() {
                return dispatch(model.HOOK_PRE_REMOVE)
                    .then(function() {
                        return call('remove');
                    })
                    .then(function (result) {
                        return dispatch(model.HOOK_POST_REMOVE).then(function() {
                            return result ? hookable(result, listeners, config.promiseFactory) : result;
                        });
                    })
                    .catch(errorHandlerFactory(model.HOOK_ERROR_REMOVE));
            },

            /**
             * Hookable proxy for `moveTo` method on the wrapped tree
             * @param {tree} destNode The future parent of the node
             * @return {promise}      A promise which is resolved if all gone without error, rejected otherwise.
             */
            moveTo: function(destNode) {
                return dispatch(model.HOOK_PRE_MOVE, [destNode])
                    .then(function() {
                        return call('moveTo', [destNode]);
                    })
                    .then(function (result) {
                        return dispatch(model.HOOK_POST_MOVE, [destNode]).then(function() {
                            return result ? hookable(result, listeners, config.promiseFactory) : result;
                        });
                    })
                    .catch(errorHandlerFactory(model.HOOK_ERROR_MOVE));
            },

            /**
             * Simple proxy for `children` method on the wrapped tree
             * @return {array} The children of the tree
             */
            children: function() {
                return call('children').map(function(child) {
                    return hookable(child);
                });
            },

            /**
             * Simple proxy for `parent` method on the wrapped tree
             * @return {mixed|hookable} The parent of the tree
             */
            parent: function() {
                var result = call('parent');

                return result ? hookable(result, listeners, config.promiseFactory) : result;
            },

            /**
             * Simple proxy for `path` method on the wrapped tree
             * @return {string} The path of the tree
             */
            path: function() {
                return call('path');
            },

            /**
             * Simple proxy for `name` method on the wrapped tree
             * @return {string} The name of the tree
             */
            name: function() {
                return call('name');
            },

            /**
             * Simple proxy for `attr` method on the wrapped tree
             * @param  {string} key
             * @param  {mixed}  value (optionnal)
             * @return {mixed|hookable} The tree on which `attr` is called
             */
            attr: function(key, value) {
                var result = call('attr', value ? [key, value] : [key]);
                return result && value ? hookable(result, listeners, config.promiseFactory) : result;
            },

            /**
             * Hookable proxy for `clone` method on the wrapped tree
             * @return {promise} A promise which is resolved if all gone without error, rejected otherwise.
             */
            clone: function() {
                return dispatch(model.HOOK_PRE_CLONE)
                    .then(function() {
                        return call('clone');
                    })
                    .then(function(result) {
                        return dispatch(model.HOOK_POST_CLONE).then(function() {
                            return hookable(result, listeners, config.promiseFactory);
                        });
                    })
                    .catch(errorHandlerFactory(model.HOOK_ERROR_CLONE));
            },

            /**
             * Will return the hookable factory
             * @return Function
             */
            factory: function() {
                return hookable;
            },

            /**
             * Will return the wrapped tree
             * @return tree
             */
            tree: function() {
                return tree;
            },

            /**
             * Will return all the hook listeners
             * @return {array} The listeners
             */
            listeners: function() {
                return listeners;
            }
        };

        /**
         * The dispatch is used to trigger a hook.
         * When a hook is triggered, we must run all its listeners synchronously
         * even if they perform async actions.
         * To achieve that, we give to each hook listener a `next` callback which must be called
         * when the listener is completed.
         * If a listener want to report an error and prevent the operation to be executed (for HOOK_PRE_*),
         * it must call `next` callback with an argument
         * @param  {string} hook The hook to trigger
         * @param  {array}  data The data to pass to the hook with the next callback
         * @return promise A promise which is resolved if all gone without error, rejected otherwise.
         */
        function dispatch(hook, data) {
            var deferred = config.promiseFactory.defer(),
            cursor = 0;

            data = data || [];

            if (listeners[hook]) {

                // this function is give to each listener and execute the next one if no error is triggered
                var next = function(err) {
                    // the current listener returned an error, reject the promise and stop the hook listeners chain
                    if (err) {
                        return deferred.reject(err);
                    }

                    // all is good to continue we increment the cursor to retrieve the next hook listener
                    cursor++;
                    if (listeners[hook].length > cursor) {
                        try {
                            return listeners[hook][cursor].apply(tree, data);
                        } catch (e) {
                            return deferred.reject(e);
                        }
                    }

                    // we reach the end of the hook listeners chain, resolve the promise
                    deferred.resolve(hook);
                };

                data.unshift(next);

                // call the first hook listener of the chain
                if (listeners[hook].length > cursor) {
                    try {
                        listeners[hook][cursor].apply(tree, data);
                    } catch (e) {
                        deferred.reject(e);
                    }
                }
            } else {
                // no hook listeners found
                deferred.resolve();
            }

            return deferred.promise;
        }

        configurable(model, config);

        return model;
    };
});
