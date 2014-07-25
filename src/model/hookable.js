define(function(require) {
    "use strict";

    var configurable = require('../util/configurable');
    // var q = require('../../bower_components/q/q');

    return function hookable (tree) {

        var config = {
            // promiseFactory: q
        };

        var listeners = {};

        function call(methodName, args) {
            args = args || [];
            return tree[methodName].apply(tree, args);
        }

        function isolateArguments(data) {
            return [].slice.apply(arguments);
        }

        var model = {
            HOOK_PRE_APPEND: 0,
            HOOK_POST_APPEND: 1,
            HOOK_PRE_REMOVE: 10,
            HOOK_POST_REMOVE: 11,
            HOOK_PRE_MOVE: 20,
            HOOK_POST_MOVE: 21,
            HOOK_PRE_CLONE: 30,
            HOOK_POST_CLONE: 31,

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

                return result ? hookable(result) : result;
            },

            append: function(childNode) {
                dispatch(model.HOOK_PRE_APPEND, [childNode]);
                var result = call('append', [childNode]);
                dispatch(model.HOOK_POST_APPEND, [childNode]);

                return hookable(result);
            },

            remove: function() {
                dispatch(model.HOOK_PRE_REMOVE);
                var result = call('remove');
                dispatch(model.HOOK_POST_REMOVE);

                return result ? hookable(result) : result;
            },

            moveTo: function(destNode) {
                dispatch(model.HOOK_PRE_MOVE, [destNode]);
                var result = call('moveTo', [destNode]);
                dispatch(model.HOOK_POST_MOVE, [destNode]);

                return result ? hookable(result) : result;
            },

            children: function() {
                return call('children').map(function(child) {
                    return hookable(child);
                });
            },

            parent: function() {
                var result = call('parent');

                return result ? hookable(result) : result;
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
                dispatch(model.HOOK_PRE_CLONE);
                var result = call('clone');
                dispatch(model.HOOK_POST_CLONE);

                return result;
            },
        };

        function dispatch(hook, data) {
            if (listeners[hook]) {
                for (var i in listeners[hook]) {
                    if (listeners[hook].hasOwnProperty(i)) {
                        listeners[hook][i].apply(tree, data); // The this of the hook is not hookable as it is directly the tree
                    }
                }
            }
        }

        configurable(model, config);

        return model;
    };
});
