/*global describe,it,expect,beforeEach,jasmine,spyOn*/

define(function(require) {
    "use strict";

    var treeFactory,
        hookableSync,
        tree,
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
            treeFactory = require('model/tree');
            tree = treeFactory(data);

            hookableSync = require('model/hookableSync');
            hookTree = hookableSync(tree);
        });

        it('should always call the same method on the wrapped tree', function() {
            spyOn(tree, 'find').andCallThrough();
            var toto = hookTree.find('/toto');

            expect(tree.find).toHaveBeenCalledWith('/toto');
            expect(tree.find('/toto').data()).toBe(toto.data());

            spyOn(tree, 'data');
            hookTree.data();
            expect(tree.data).toHaveBeenCalled();

            hookTree.data({ name: 'test' })
            expect(tree.data).toHaveBeenCalledWith({ name: 'test' });

            spyOn(tree, 'append');
            hookTree.append({ name: 'test'}).done(function() {console.log('oui');
                expect(tree.append).toHaveBeenCalledWith({ name: 'test' });
                done();
            });

            spyOn(tree, 'remove');
            hookTree.remove();
            expect(tree.remove).toHaveBeenCalled();

            spyOn(tree, 'moveTo');
            var node = treeFactory({ name: 'test'});
            hookTree.moveTo(node);
            expect(tree.moveTo).toHaveBeenCalledWith(node);

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

            spyOn(tree, 'clone');
            hookTree.clone();
            expect(tree.clone).toHaveBeenCalled();
        });

        // it ('should call pre hook listeners before calling a method and post hooks listeners after', function() {
        //     var i = 0;

        //     hookTree.registerListener(hookTree.HOOK_PRE_APPEND, function(next, node) {
        //         i += 5;
        //         next();
        //     });

        //     hookTree.registerListener(hookTree.HOOK_POST_APPEND, function(next, node) {
        //         i *= 2;
        //         next();
        //     });

        //     hookTree.append(treeFactory({ name: 'test' })).then(function() {console.log(i);
        //         expect(i).toBe(109); // ensure that listeners are called with the right order
        //     });

        //     expect(i).toBe(109);
        // });
    });
});
