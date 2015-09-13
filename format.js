var makehead = function(cl, stuff, id) {
    var ins = '';
    if (id) {
        ins = ' id="' + id + '"';
    }
    return '<div class="' + cl + '"' + ins + '><span class="header">' + cl[0].toUpperCase() + cl.slice(1) + '</span><span class="delete" onclick="delthing(event);">Delete</span><br>' + stuff + '</div>';
}
var nicejson = function(dct) {
    var ret;
    if (dct.constructor === Array) {
        ret = '<ul>';
        for (var i = 0; i < dct.length; i++) {
            ret += '<li>' + nicejson(dct[i]) + '</li>';
        }
        return makehead('list', ret + '</ul><span class="list-add" onclick="listadd(event);">Add</span>');
    } else if (dct === true || dct === false) {
        return makehead(String(dct), '<span class="bool">' + dct + '</span>');
    } else if (typeof dct === 'string') {
        var cls = 'symbol';
        var id = false;
        if (dct === '~' || dct[0] === '@' || dct[0] === '%') {
            cls = 'wildcard';
            if (dct[0] === '@') {
                id = 'w' + dct[1];
            }
        }
        return makehead(cls, '<span class="value">' + dct + '</span>', id);
    } else {
        ret = '<table><tbody>';
        if ('type' in dct) {
            ret += '<tr><td><span class="key type">type</span></td><td>' + nicejson(dct['type']) + '</td></tr>';
        }
        if ('is' in dct) {
            ret += '<tr><td><span class="key is">is</span></td><td>' + nicejson(dct['is']) + '</td></tr>';
        }
        for (var i in dct) {
            if (i !== 'type' && i !== 'is') {
                ret += '<tr><td><span class="key">' + i + '</span></td><td>' + nicejson(dct[i]) + '</td></tr>';
            }
        }
        return makehead('node', ret + '</tbody></table><span class="node-add" onclick="nodeadd(event);">Add</span>');
    }
}
var disnice = function(html) {
    console.log(html);
    var ret;
    console.log(html.className);
    switch (html.className) {
        case 'list':
            ret = []
            for (var i = 0; i < html.children[3].children.length; i++) {
                ret.push(disnice(html.children[3].children[i].children[0]));
            } break;
        case 'symbol':
        case 'wildcard':
            ret = html.children[3].innerHTML;
            break;
        case 'true':
            ret = true;
            break;
        case 'false':
            ret = false;
            break;
        case 'node':
            var ls = html.children[3].firstChild.children;
            ret = {};
            for (var i = 0; i < ls.length; i++) {
                ret[ls[i].children[0].children[0].innerHTML] = disnice(ls[i].children[1].children[0]);
            } break;
        default:
            ret = null;
    }
    return ret;
}
var jsontolisp = function(dct) {
    var ret;
    if (dct.constructor === Array) {
        ret = '(list';
        for (var i = 0; i < dct.length; i++) {
            ret += ' ' + jsontolisp(dct[i]);
        }
        return ret + ')';
    } else if (typeof dct === 'string') {
        return ':' + dct;
    } else if (dct === true) {
        return 't';
    } else if (dct === false) {
        return 'nil';
    } else {
        ret = '{';
        for (var i in dct) {
            if (i === 'is') {
                ret += '(:is . "' + dct[i] + '") ';
            } else {
                ret += '(:' + i + ' . ' + jsontolisp(dct[i]) + ') ';
            }
        }
        return ret + '}';
    }
}
var makesel = function(onc) {
    var typs = ['Boolean', 'List', 'Node', 'Symbol', 'Wildcard'];
    r = '<div class="select">';
    for (var i = 0; i < 5; i++) {
        r += '<input type="radio" name="type-sel" value="' + typs[i] + '">' + typs[i] + '</input>';
    }
    return r + '<button onclick="' + onc + '">Add</button></div>';
}
var listadd = function(e) {
    e.target.parentNode.children[3].innerHTML += '<li>' + makesel('listsel(event);') + '</li>';
}
var nodeadd = function(e) {
    e.target.parentNode.children[3].children[0].innerHTML += '<tr><td><input type="text"></input></td><td>' + makesel('nodesel(event);') + '</td></tr>';
}
var _addtrue = function(e) {
    e.target.parentNode.outerHTML = makehead('true', '<span class="bool">true</span>');
}
var _addfalse = function(e) {
    e.target.parentNode.outerHTML = makehead('false', '<span class="bool">false</span>');
}
var addboolean = function() {
    return '<div><button onclick="_addtrue(event);">True</button><button onclick="_addfalse(event);">False</button></div>';
}
var addlist = function() {
    return makehead('list', '<ul></ul><span class="list-add" onclick="listadd(event);">Add</span>');
}
var addnode = function() {
    return makehead('node', '<table><tbody></tbody></table><span class="node-add" onclick="nodeadd(event);">Add</span>');
}
var _makesymbol = function(e) {
    var s = e.target.parentNode.children[0].value;
    e.target.parentNode.outerHTML = makehead('symbol', '<span class="value">' + s + '</span>');
}
var addsymbol = function() {
    return '<div><input type="text"></input><button onclick="_makesymbol(event);">Add</button></div>';
}
var _makewild = function(e) {
    var s = $('input[name="wild-sel"]:checked').val();
    if (s[0] === '@') {
        e.target.parentNode.outerHTML = makehead('wildcard', '<span class="value">' + s + '</span>', 'w' + s[1]);
    } else {
        e.target.parentNode.outerHTML = makehead('wildcard', '<span class="value">' + s + '</span>');
    }
}
var addwildcard = function() {
    var r = '<div>';
    var l = ['~', '@1', '@2', '@3', '@4', '@5', '@6', '@7', '@8', '@9', '%1', '%2', '%3', '%4', '%5', '%6', '%7', '%8', '%9'];
    for (var i = 0; i < l.length; i++) {
        r += '<input type="radio" name="wild-sel" value="' + l[i] + '">' + l[i] + '</input>';
    }
    return r + '<button onclick="_makewild(event);">Add</button></div>';
}
var listsel = function(e) {
    var type = $('input[name="type-sel"]:checked').val();
    var fns = {'Boolean': addboolean, 'List': addlist, 'Node': addnode, 'Symbol': addsymbol, 'Wildcard': addwildcard};
    if (type) {
        e.target.parentNode.outerHTML = fns[type]();
    }
}
var nodesel = function(e) {
    var type = $('input[name="type-sel"]:checked').val();
    var fns = {'Boolean': addboolean, 'List': addlist, 'Node': addnode, 'Symbol': addsymbol, 'Wildcard': addwildcard};
    var row = e.target.parentNode.parentNode.parentNode;
    if (type && row.children[0].children[0].value) {
        row.children[0].innerHTML = '<span class="key">' + row.children[0].children[0].value + '</span>';
        e.target.parentNode.outerHTML = fns[type]();
    }
}
var patsel = function(e) {
    var type = $('input[name="type-sel"]:checked').val();
    var fns = {'Boolean': addboolean, 'List': addlist, 'Node': addnode, 'Symbol': addsymbol, 'Wildcard': addwildcard};
    e.target.parentNode.outerHTML = fns[type]();
}
var addnext = function(e) {
    e.target.parentNode.innerHTML += '<input></input>';
}
var newpat = function(n) {
    var r = '<input class="patname">Name</input><br>';
    r += '<div class="next"><h3>Next</h3><button onclick="addnext(event);">Add</button></div>';
    r += '<div class="fn"><h3>Function</h3><select class="fnname"><option value="bind">Bind</option><option value="desc">Description</option></select>';
    r += '<select class="fndir"><option value=":<">&#8592</option><option value=":>">&#8594</option></select><input class="fnkey">key (bind only)</input></div>';
    r += '<div class="patnodes">';
    for (var i = 0; i < n; i++) {
        r += makesel('patsel(event);');
    }
    return makehead('patern', r + '</div>');
}
var parsepat = function(node) {
    var patname = node.getElementsByClassName('patname')[0].value || 'nil';
    var next = [];
    for (var i = 2; i < node.getElementsByClassName('next')[0].children.length; i++) {
        next.push(node.getElementsByClassName('next')[0].children[i].value || 'nil');
    }
    //var fn = [node.children[5].children[1].value, node.children[5].children[2].value, node.children[5].children[3].value];
    var fn = [node.getElementsByClassName('fnname')[0].value, node.getElementsByClassName('fndir')[0].value, node.getElementsByClassName('fnkey')[0].value || 'nil'];
    var nodes = [];
    for (var i = 0; i < node.getElementsByClassName('patnodes')[0].children.length; i++) {
        console.log(node.getElementsByClassName('patnodes')[0].children);
        nodes.push(disnice(node.getElementsByClassName('patnodes')[0].children[i]));
    }
    var nodestr = '';
    for (var i = 0; i < nodes.length; i++) {
        console.log(nodes);
        nodestr += ' ' + jsontolisp(nodes[i]);
    }
    nodestr = "'(" + nodestr.slice(1) + ')';
    var fnstr = '(' + fn[0] + ' ' + fn[1];
    if (fn[0] === 'bind') {
        fnstr += ' ' + fn[2];
    }
    fnstr += ')';
    var ptype = 'ls-pat';
    var nn = ':nodes';
    if (nodestr.indexOf('@') >= 0 || nodestr.indexOf('%') >= 0) {
        ptype = 'ref-pat';
        nn = ':ref-nodes';
    }
    return "(make-instance '" + ptype + " :next '(" + next.join(' ') + ") :name '" + patname + ' ' + nn + ' ' + nodestr + ' :fn ' + fnstr + ')';
}
var allpats = function(div) {
    var ss = ';;Generated by nlparse/friendly\n\
(defpackage :syntax\n\
  (:use :syntax-utils :utils :cl)\n\
  (:export :pats))\n\
(in-package :syntax)\n\
\n\
(setf pats\n\
      (list';
    for (var i = 0; i < div.children.length; i++) {
        ss += '\n       ' + parsepat(div.children[i]);
    }
    return ss + '\n      ))';
}
