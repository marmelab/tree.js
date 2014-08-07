define(function(require) {
    "use strict";

    var configurable = require('../util/configurable');
    var q = require('../../bower_components/q/q');

    return function hookable (tree, listeners, promiseFactory) {

        var config = {
            promiseFactory: promiseFactory || q
        };

        listeners = listeners || {};

        function call(methodName, args) {
            args = args || [];
            return tree[methodName].apply(tree, args);
        }

        function errorHandlerFactory(hook) {
            return function(err) {
                return dispatch(hook).then(function() {
                    return config.promiseFactory.reject(err);
                });
            };
        }

        var model = {
            HOOK_PRE_APPEND: 0,
            HOOK_POST_APPEND: 1,
            HOOK_ERROR_APPEND: 2,
            HOOK_PRE_REMOVE: 10,
            HOOK_POST_REMOVE: 11,
            HOOK_ERROR_REMOVE: 12,
            HOOK_PRE_MOVE: 20,
            HOOK_POST_MOVE: 21,
            HOOK_ERROR_MOVE: 22,
            HOOK_PRE_CLONE: 30,
            HOOK_POST_CLONE: 31,
            HOOK_ERROR_CLONE: 32,

            registerListener: function(hook, callback) {
                if (!listeners[hook]) {
                    listeners[hook] = [];
                }

                listeners[hook].push(callback);
            },

            data: function(d) {
                return call('data', d ? [d]: []);
            },

            find: function(path) {
                var result = call('find', [path]);

                return result ? hookable(result, listeners, config.promiseFactory) : result;
            },

            append: function(childNode) {
                return dispatch(model.HOOK_PRE_APPEND, [childNode])
                    .then(function() {
                        return call('append', [childNode]);
                    })
                    .then(function(result) {
                        return dispatch(model.HOOK_POST_APPEND, [childNode]).then(function() {
                            return hookable(result, listeners, config.promiseFactory);
                        });
                    })
                    .catch(errorHandlerFactory(model.HOOK_ERROR_APPEND));
            },

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

            children: function() {
                return call('children').map(function(child) {
                    return hookable(child);
                });
            },

            parent: function() {
                var result = call('parent');

                return result ? hookable(result, listeners, config.promiseFactory) : result;
            },

            path: function() {
                return call('path');
            },

            name: function() {
                return call('name');
            },

            attr: function(key, value) {
                return call('attr', value ? [key, value] : [key]);
            },

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

            factory: function() {
                return function(data, listeners, promiseFactory) {
                    return hookable(tree.factory()(data), listeners, promiseFactory);
                };
            }
        };

        function dispatch(hook, data) {
            var deferred = config.promiseFactory.defer(),
            cursor = 0;

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
                        return listeners[hook][cursor].apply(tree, data);
                    }

                    // we reach the end of the hook listeners chain, resolve the promise
                    deferred.resolve(hook);
                };

                data.unshift(next);

                // call the first hook listener of the chain
                if (listeners[hook].length > cursor) {
                    listeners[hook][cursor].apply(tree, data);
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
