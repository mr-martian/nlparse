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
        //return '<div class="' + cls + '"><span class="header">' + lab + '</span><span class="delete">Delete</span><br><span class="value">' + dct + '</span></div>';
    } else {
        ret = '<div class="node"><span class="header">Node</span><span class="delete">Delete</span><br><table><tbody>';
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
        return ret + '</tbody></table><span class="node-add" onclick="nodeadd(event);">Add</span></div>';
    }
}
var disnice = function(html) {
    var ret;
    switch (html.className) {
        case 'list':
            ret = []
            for (var i = 0; i < html.children[3].children.length; i++) {
                ret.push(disnice(html.children[3].children[i].children[0]));
            } break;
        case 'val':
        case 'wildcard':
            ret = html.children[3].innerHTML;
            break;
        case 'true':
        case 'false':
            ret = Boolean(html.children[3].innerHTML);
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
var listadd = function(e) {
    e.target.parentNode.children[3].innerHTML += '<li><div class="select"><input type="radio" name="list-sel" value="Boolean">Boolean</input><input type="radio" name="list-sel" value="List">List</input><input type="radio" name="list-sel" value="Node">Node</input><br><input type="radio" name="list-sel" value="Symbol">Symbol</input><input type="radio" name="list-sel" value="Wildcard">Wildcard</input><button class="list-sel" onclick="listsel(event);">Add</button></div></li>';
}
var nodeadd = function(e) {
    e.target.parentNode.children[3].children[0].innerHTML += '<tr><td><input type="text"></input></td><td><div class="select"><input type="radio" name="list-sel" value="Boolean">Boolean</input><input type="radio" name="list-sel" value="List">List</input><input type="radio" name="list-sel" value="Node">Node</input><br><input type="radio" name="list-sel" value="Symbol">Symbol</input><input type="radio" name="list-sel" value="Wildcard">Wildcard</input><button class="node-sel" onclick="nodesel(event);">Add</button></div>';
}
var listsel = function(e) {
}
