Tree.js
=======

Tree.js is Javascript librairy to build and manipulate myTree.

Installation
============

It is available with bower:

```
bower install tree.js
```

Usage
=====

#### Create a tree

```javascript

// tree = require('tree');
var myTree = tree({
    children: [
        {
            name: 'dupuis',
            children: [
                {
                    name: 'prunelle'
                },
                {
                    name: 'lebrac',
                    job: 'designer'
                },
                {
                    name: 'lagaffe',
                    firstname: 'gaston'
                },
            ]
        }
    }
    ]
});
```

#### Find a node

```javascript
var lebrac = myTree.find('/dupuis/lebrac');

// or

lebrac = myTree.find('/dupuis').find('/lebrac');
```

#### Get the raw data of a node

```javascript
lebrac.data() // { name: 'lebrac', job: 'designer' }
```

#### Get an attribute

```javascript
lebrac.attr('job'); // designer
```

#### Set an attribute

```javascript
lebrac.attr('job', 'director');
lebrac
    .attr('location', 'here')
    .attr('hobby', 'design')
```

#### Get the path of a node

```javascript
lebrac.path(); // /dupuis/lebrac
```

#### Get the parent of a node

```javascript
var dupuis = lebrac.parent();
dupuis.name(); // dupuis
dupuis.parent(); // undefined
```

#### Append a child node

```javascript
lebrac.append(tree({
    name: 'paper',
    children: [
        {
            name: 'pen'
        }
    ]
}));

lebrac.find('/paper/pen');
lebrac.find('/paper').parent().parent().name(); // dupuis
```

#### Remove a node

```javascript
lebrac.remove();
myTree.find('/dupuis/lebrac'); // undefined
```

#### Move a node

```javascript
var prunelle = myTree.find('/dupuis/prunelle').moveTo(myTree.find('/dupuis/lagaffe'));
prunelle.path(); // /dupuis/lagaffe/prunelle
```

#### Get the children of a node

```javascript
var children = myTree.find('/dupuis').children();
children[1].name(); // lebrac
```
