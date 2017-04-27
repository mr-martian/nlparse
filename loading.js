var parserule = function(in_txt) {
  var txt = in_txt.split('');
  var subparse = function(t) {
    var rem = function(t, c) {
      while (t.length > 0 && t[0] === c) { t.shift(); }
    }
    var r;
    if (t.length === 0) {
      return undefined;
    }
    rem(t, ' ');
    switch (t[0]) {
      case '#':
        r = {"thisisa": "noderef", "node": ""};
        t.shift();
        while (t.length > 0 && t[0].match(/^[0-9]/)) { r.node += t.shift(); }
        r.node = parseInt(r.node);
        break;
      case '@':
        r = {"thisisa": "wildcard", "id": ""};
        t.shift();
        if (t[0] === "!") {
          t.shift();
          r.ispat = true;
        }
        while (t.length > 0 && t[0].match(/^[a-z\-0-9]/)) { r.id += t.shift(); }
        if (r.id === "") {
          r.id = null;
        } else {
          r.id = parseInt(r.id);
        } break;
      case '$':
        t.shift();
        r = {"thisisa": "node", "type": subparse(t)};
        if (r.type === "") {
          r = {};
        }
        rem(t, ' ');
        if (t.length > 0 && t[0] === '{') {
          t.shift();
          var a;
          while (t.length > 0 && t[0] !== '}') {
            a = subparse(t);
            if (a.constructor === Array) {
              r[a[0]] = a[1];
            } else {
              r[a] = {"thisisa": "wildcard", "id": null}
            }
          }
          if (t.length === 0) {
            return undefined;
          } else {
            t.shift();
          }
        } break;
      case '[':
        t.shift();
        r = [];
        while (t.length > 0 && t[0] !== ']') {
          r.push(subparse(t));
        }
        if (t.length > 0) {
          t.shift();
        } else {
          return undefined;
        } break;
      case '(':
        t.shift();
        r = {"thisisa": "or", "options": []};
        while (t.length > 0 && t[0] !== ')') {
          r.options.push(subparse(t));
        }
        if (t.length > 0) {
          t.shift();
        } else {
          return undefined;
        } break;
      case '!':
        t.shift();
        r = [subparse(t), null];
        break;
      case '+':
        t.shift();
        var o = false;
        if (t[0] === "!") {
          o = true;
          t.shift();
        }
        r = {"thisisa": "merge", "things": subparse(t), "override": o};
        break;
      case '?':
        t.shift();
        r = {"thisisa": "syntaxrule"}
        r.nodes = subparse(t);
        r.function = subparse(t);
        r.next = subparse(t);
        break;
      case '*':
        t.shift();
        l = subparse(t);
        r = {"thisisa": "merge", "things": [l[0], {"thisisa": "node"}]};
        r.things[1][l[1]] = l[2];
        break;
      case '<':
        t.shift();
        if (t[0] === '~') {
          //
        } else {
          var w = 'words';
          if (t[0] === '!') {
            w = 'file';
            t.shift()
          }
          r = {"thisisa": "list"};
          r[w] = subparse(t);
          rem(t, ' ');
          if (t[0] === '>') {
            r.function = {"thisisa": "noderef", "id": 0};
            t.shift();
          } else {
            r.function = subparse(t);
            rem(t, ' ');
            if (t[0] === '>') {
              r.decapitalize = false;
              t.shift();
            } else {
              r.decapitalize = subparse(t);
              rem(t, ' ');
              if (t[0] !== '>') {
                return null;
              } else {
                t.shift();
              }
            }
          }
        }
      default:
        r = "";
        while (t.length > 0 && t[0].match(/^[^#@${}()\[\]!+?*<>~ ]/)) { r += t.shift(); }
        if (r === "true" || r === "false" || r === "null") {
          r = JSON.parse(r);
        }
    }
    return r;
  }
  var ret = subparse(txt);
  if (txt.length === 0 && ret !== undefined) {
    return ret;
  } else {
    return in_txt;
  }
}
var parsetree = function(thing) {
  if (_.isString(thing)) {
    return parserule(thing);
  } else if (_.isArray(thing)) {
    return _.map(thing, parsetree);
  } else if (_.isObject(thing) && !_.isNull(thing)) {
    return _.mapObject(thing, function(v, k) {
      return (thing.thisisa === "morphologyrule" && k !== "function" && k !== "next") || thing.thisisa === "wordify" ? v : parsetree(v);
    });
  } else {
    return thing;
  }
}
var langs = {};
var curlang;
var waiting = 0;
var loadlang = function(lang) {
  if (!langs.hasOwnProperty(lang)) {
    waiting += 1;
    $.getJSON("langs/" + lang + "/main.json", function(stuff) {
      waiting -= 1;
      langs[lang] = parsetree(stuff);
      var loadfiles = function(rule) {
        if (rule.thisisa === "list" && rule.file) {
          _.map(ls(rule.file), function(f) {
            waiting += 1;
            $.getJSON("langs/" + lang + "/" + f, function(s) {
              var r = parsetree(s);
              rule.words = _.isArray(r) ? (rule.words || []).concat(r) : _.extend((rule.words || {}), r);
              waiting -= 1;
            });
          });
        } else if (rule.thisisa === "morphologyrule") {
          (rule.next || []).map(loadfiles);
        }
      }
      for (var k in langs[lang].morphology) {
        loadfiles(langs[lang].morphology[k]);
      }
    });
  }
}
var listlangs = function(fn) {
  $.getJSON("langs/langs.json", fn);
}
