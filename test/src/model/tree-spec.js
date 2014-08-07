/*global describe,it,expect,beforeEach,jasmine*/

define(function(require) {
    "use strict";

    var treeFactory,
        tree,
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

        });

        it('should find a node', function() {
            expect(tree.find('/toto').data()).toEqual({
                name: 'toto',
                children: [
                    {
                        name: 'tata',
                        children: [],
                        _parent: jasmine.any(Object)
                    },
                    {
                        name: 'titi',
                        children: [],
                        _parent: jasmine.any(Object)
                    }
                ],
                _parent: jasmine.any(Object)
            });

            expect(tree.find('/toto/tata').data()).toEqual({
                name: 'tata',
                children: [],
                _parent: jasmine.any(Object)
            });

            expect(tree.find('/toto').find('/tata').data()).toEqual({
                name: 'tata',
                children: [],
                _parent: jasmine.any(Object)
            });
        });

        it('should compute the path', function() {
            expect(tree.path()).toBe('/');
            expect(tree.find('/toto').path()).toBe('/toto');
            expect(tree.find('/toto').find('/tata').path()).toBe('/toto/tata');
        });

        it('should propagate update', function() {
            var toto = tree.find('/toto');
            toto.attr('test','testme');
            expect(toto.parent().find('/toto').data().test).toBe('testme');

            expect(toto.find('/tata').parent().parent().find('/toto/titi').parent().attr('test')).toBe('testme');
        });

        it('should append a node', function() {
            var toto = tree.find('/toto');

            var node = treeFactory({
                name: 'new',
                children: [
                    {
                        name: 'old'
                    }
                ]
            });
            toto.append(node);
            expect(toto.find('/new/old')).not.toBeUndefined();
            expect(toto.find('/new/old').parent().parent().data()).toBe(toto.data());
        });

        it('should remove a node', function() {
            var toto = tree.find('/toto/titi').remove();
            expect(toto.find('/titi')).toBeUndefined();
            expect(tree.find('/toto/titi')).toBeUndefined();
            expect(tree.find('/toto/tata').append(treeFactory({ name: 'boum' })).parent().remove().find('/tata/boum')).toBeUndefined();
        });

        it('should move a node', function() {
            var titi = tree.find('/toto/titi').moveTo(tree.find('/'));
            expect(tree.find('/titi').data()).toBe(titi.data());
            expect(tree.find('/toto/titi')).toBeUndefined();
        });

        it('should clone a node', function() {
            var toto = tree.find('/toto').clone();
            expect(toto.data()).not.toBe(tree.find('/toto').data());
            expect(toto.data()).toEqual({
                name: tree.find('/toto').name(),
                children: jasmine.any(Object)
            });

            tree.find('/toto').attr('test', 'ok');
            expect(toto.attr('test')).toBeUndefined();

            expect(tree.find('/toto').find('/titi').data()).toBe(tree.find('/toto/titi').data());
            expect(toto.find('/titi').data()).not.toBe(tree.find('/toto/titi').data());
        });

        it('should provide its factory',function() {
            expect(tree.factory()).toBe(treeFactory);
        });
    });
});
