/*global describe,it,expect,beforeEach,jasmine,spyOn,runs,waitsFor,Tree*/

(function() {
    "use strict";

    var tree,
        hookTree,
        data;

    describe('Tree', function() {
        beforeEach(function() {
            data = {
                name: 'root',
                children: [
                    {
                        name: 'toto',
                        children: [
                            {
                                name: 'tata',
                                children: []
                            },
                            {
                                name: 'titi',
                                children: []
                            }
                        ]
                    }
                ]
            };

            tree = Tree.tree(data);

            hookTree = Tree.hookable(tree);
        });

        it('should always call the same method on the wrapped tree', function() {
            spyOn(tree, 'find').andCallThrough();
            var toto = hookTree.find('/toto');

            expect(tree.find).toHaveBeenCalledWith('/toto');
            expect(tree.find('/toto').data()).toBe(toto.data());

            spyOn(tree, 'data');
            hookTree.data();
            expect(tree.data).toHaveBeenCalled();

            hookTree.data({ name: 'test' });
            expect(tree.data).toHaveBeenCalledWith({ name: 'test' });


            // APPEND
            var appendResult,
                appendedNode = Tree.tree({ name: 'test'})
            ;
            spyOn(tree, 'append');
            runs(function() {
                hookTree.append(appendedNode).then(function() {
                    appendResult = 'resolved';
                }, function() {
                    appendResult = 'rejected';
                });
            });

            waitsFor(function() {
                return !!appendResult;
            });

            runs(function() {
                expect(appendResult).toEqual('resolved');
                expect(tree.append).toHaveBeenCalledWith(appendedNode);
            });

            // REMOVE
            var removeResult;
            spyOn(tree, 'remove');
            runs(function() {
                hookTree.remove().then(function() {
                    removeResult = 'resolved';
                }, function() {
                    removeResult = 'rejected';
                });
            });

            waitsFor(function() {
                return !!removeResult;
            });

            runs(function() {
                expect(removeResult).toEqual('resolved');
                expect(tree.remove).toHaveBeenCalledWith();
            });

            // MOVETO
            var moveToResult,
                targetNode = Tree.tree({ name: 'test'})
            ;
            spyOn(tree, 'moveTo');
            runs(function() {
                hookTree.moveTo(targetNode).then(function() {
                    moveToResult = 'resolved';
                }, function() {
                    moveToResult = 'rejected';
                });
            });

            waitsFor(function() {
                return !!moveToResult;
            });

            runs(function() {
                expect(moveToResult).toEqual('resolved');
                expect(tree.moveTo).toHaveBeenCalledWith(targetNode);
            });

            spyOn(tree, 'children').andCallThrough();
            hookTree.children();
            expect(tree.children).toHaveBeenCalled();

            spyOn(tree, 'path');
            hookTree.path();
            expect(tree.path).toHaveBeenCalled();

            spyOn(tree, 'name');
            hookTree.name();
            expect(tree.name).toHaveBeenCalled();

            spyOn(tree, 'attr');
            hookTree.attr('test', 'ok');
            expect(tree.attr).toHaveBeenCalledWith('test', 'ok');

            hookTree.attr('test');
            expect(tree.attr).toHaveBeenCalledWith('test');

            // MOVETO
            var cloneResult;
            spyOn(tree, 'clone');
            runs(function() {
                hookTree.clone().then(function() {
                    cloneResult = 'resolved';
                }, function() {
                    cloneResult = 'rejected';
                });
            });

            waitsFor(function() {
                return !!cloneResult;
            });

            runs(function() {
                expect(cloneResult).toEqual('resolved');
                expect(tree.clone).toHaveBeenCalledWith();
            });

            spyOn(tree, 'visitor');
            hookTree.visitor();
            expect(tree.visitor).toHaveBeenCalled();

            spyOn(tree, 'stringify');
            hookTree.stringify();
            expect(tree.stringify).toHaveBeenCalled();

        });

        it ('should call pre hook listeners before calling a method and post hooks listeners after', function() {
            var i = 0;

            hookTree.registerListener(hookTree.HOOK_PRE_APPEND, function(node) {
                i += 5;
            });

            hookTree.registerListener(hookTree.HOOK_POST_APPEND, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.append(Tree.tree({ name: 'test' })).then(function() {
                    i *= 3;
                    result = 'resolved';
                }, function() {
                    result = 'rejected';
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('resolved');
                expect(i).toBe(30); // ensure that listeners are called with the right order
            });
        });

        it ('should share hook listeners will all sub tree', function() {
            var i = 0;

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i += 5;
            });

            hookTree.registerListener(hookTree.HOOK_POST_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.find('/toto/tata').remove().then(function() {
                    result = 'resolved';
                }, function() {
                    result = 'rejected';
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('resolved');
                expect(i).toBe(10); // ensure that listeners are called with the right order
            });
        });

        it ('should share hook listeners will all up tree', function() {
            var i = 0;

            var childNode = hookTree.find('/toto/tata');
            childNode.registerListener(childNode.HOOK_PRE_REMOVE, function(node) {
                i += 6;
            });

            childNode.registerListener(childNode.HOOK_POST_REMOVE, function(node) {
                i *= 3;
            });

            var result;
            runs(function() {
                hookTree.find('/toto').remove().then(function() {
                    result = 'resolved';
                }, function() {
                    result = 'rejected';
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('resolved');
                expect(i).toBe(18); // ensure that listeners are called with the right order
            });
        });

        it ('should share hook listeners will all appended tree', function() {
            var i = 0;

            var childNode = Tree.tree({ name: 'plop'});
            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i += 7;
            });

            hookTree.registerListener(hookTree.HOOK_POST_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.append(childNode).then(function(childNode) {
                    childNode.remove().then(function() {
                        result = 'resolved';
                    }, function() {
                        result = 'rejected';
                    });
                }, function() {
                    result = 'rejected';
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('resolved');
                expect(i).toBe(14); // ensure that listeners are called with the right order
            });
        });

        it ('should keep hook listeners when we append a hookable tree', function() {
            var i = 0;

            var childNode = Tree.hookable(Tree.tree({ name: 'plop'}));
            childNode.registerListener(childNode.HOOK_PRE_REMOVE, function(node) {
                i += 7;
            });

            hookTree.registerListener(hookTree.HOOK_POST_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.append(childNode).then(function(childNode) {
                    childNode.remove().then(function() {
                        result = 'resolved';
                    }, function() {
                        result = 'rejected';
                    });
                }, function() {
                    result = 'rejected';
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('resolved');
                expect(i).toBe(14); // ensure that listeners are called with the right order
            });
        });

        it ('should trigger error hook when an error occured', function() {
            var i = 0;

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i += 7;

                return Q.reject('oops');
            });

            hookTree.registerListener(hookTree.HOOK_ERROR_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.remove().then(function(childNode) {
                    result = 'resolved';
                }, function(err) {
                    result = err;
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('oops');
                expect(i).toBe(14); // ensure that listeners are called with the right order
            });
        });

        it('should trigger error hook when an error occured because of an exception', function() {
            var i = 0;

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i += 7;
                throw new Error('oops');
            });

            hookTree.registerListener(hookTree.HOOK_ERROR_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.remove().then(function(childNode) {
                    result = 'resolved';
                }, function(err) {
                    result = err.message;
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('oops');
                expect(i).toBe(14); // ensure that listeners are called with the right order
            });
        });

        it('should wait for promise to be resolved when a listener returns a resolved one', function() {
            var i = 0;

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i += 7;

                return Q().then(function() {
                    i += 3;
                });
            });

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.remove().then(function(childNode) {
                    result = 'resolved';
                }, function(err) {
                    result = err.message;
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('resolved');
                expect(i).toBe(20); // ensure that listeners are called with the right order
            });
        });

        it('should wait for promise to be resolved when a listener returns a rejected one', function() {
            var i = 0;

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i += 7;

                return Q.reject('it fails');
            });

            hookTree.registerListener(hookTree.HOOK_PRE_REMOVE, function(node) {
                i *= 2;
            });

            var result;
            runs(function() {
                hookTree.remove().then(function(childNode) {
                    result = 'resolved';
                }, function(err) {
                    result = err;
                });
            });

            waitsFor(function() {
                return !!result;
            });

            runs(function() {
                expect(result).toEqual('it fails');
                expect(i).toBe(7); // ensure that listeners are called with the right order
            });
        });

        it('should provide its factory', function() {
            expect(hookTree.factory()).toBe(Tree.hookable);
        });
    });
})();
