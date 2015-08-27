var nicejson = function(dct) {
    var ret;
    if (dct.constructor === Array) {
        ret = '<div class="list"><span class="header">List</span><span class="delete">Delete</span><br><ul>';
        for (var i = 0; i < dct.length; i++) {
            ret += '<li>' + nicejson(dct[i]) + '</li>';
        }
        return ret + '</ul></div>';
    } else if (typeof dct === 'string') {
        return '<div class="val"><span class="header">Value</span><span class="delete">Delete</span><br><span class="value">' + dct + '</span></div>';
    } else if (dct === true) {
    } else if (dct === false) {
    } else {
    }
}
var disnice = function(html) {
    var ret;
    switch (html.className) {
        case 'list':
            ret = []
            for (var i = 0; i < html.children[3].children.length; i++) {
                ret.push(disnice(html.children[3].children[i].children[0]));
            }
            break;
        case 'val':
            ret = html.children[3].innerHTML;
    }
    return ret;
}
