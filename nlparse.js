var copy_thing = function(thing) {
  return JSON.parse(JSON.stringify(thing));
}
var objeq = function(a, b) {
  if (typeof a !== "object" || typeof b !== "object") {
    return a === b;
  } else if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  } else {
    for (k in a) {
      if (!objeq(a[k], b[k])) {
        if (!((a[k].constructor === Array && a[k].length === 1 && objeq(a[k][0], b[k])) ||
              (b[k].constructor === Array && b[k].length === 1 && objeq(a[k], b[k][0])))) {
          return false;
        }
      }
    }
  }
  return true;
}
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
          delete r.type;
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
            rem(t, ' ');
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
          rem(t, ' ');
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
          rem(t, ' ');
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
        r = {"thisisa": "merge", "things": subparse(t)};
        break;
      default:
        r = "";
        while (t.length > 0 && t[0].match(/^[a-z\-]/)) { r += t.shift(); }
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
  if (typeof thing === "string") {
    return parserule(thing);
  } else if (thing !== null && thing.constructor === Array) {
    var ret = [];
    for (var i = 0; i < thing.length; i++) {
      ret.push(parsetree(thing[i]));
    }
    return ret;
  } else if (typeof thing === "object" && thing !== null) {
    var ret = {};
    for (k in thing) {
      ret[k] = parsetree(thing[k]);
    }
    return ret;
  } else {
    return thing;
  }
}
langs = {};
lists = {};
var loadlib = function(lang, k, fn) {
  if (lists[lang].hasOwnProperty(k)) {
    fn(lists[lang][k]);
  } else {
    $.getJSON("langs/" + lang + "/" + langs[lang].morphology[k].list, function(s) {
      lists[lang][k] = s
      fn(s);
    });
  }
}
waiting = 0;
var loadlang = function(lang, fn) {
  if (langs.hasOwnProperty(lang)) {
    fn(langs[lang]);
  } else {
    waiting += 1;
    $.getJSON("langs/" + lang + "/main.json", function(stuff) {
      waiting -= 1;
      langs[lang] = parsetree(stuff);
      lists[lang] = {};
      for (var k in langs[lang].morphology) {
        if (langs[lang].morphology[k].thisisa === "load") {
          waiting += 1;
          loadlib(lang, k, function() { waiting -= 1; });
        }
      }
      fn(langs[lang]);
    });
  }
}
var listlangs = function(fn) {
  $.getJSON("langs/langs.json", fn);
}
var loadalllangs = function() {
  listlangs(function(stuff) {
    for (var i = 0; i < stuff.length; i++) {
      loadlang(stuff[i].code, function() {});
    }
  });
}
var matchone = function(pat, node, wilds) {
  if (pat === node) {
    return wilds;
  } else if (pat.thisisa === node.thisisa && typeof pat === "object") {
    //if they're both undefined, this will cover arrays as well
    for (var k in pat) {
      if (pat[k] && pat[k].thisisa === "or") {
        for (var i = 0; i < pat[k].options; i++) {
          var pp = copy_thing(pat);
          pp[k] = pat[k][i];
          var m = matchone(pp, node, wilds);
          if (m) {
            return m;
          }
        }
        return false;
      } else if (pat[k] === null) {
        if (node.hasOwnProperty(k)) {
          return false;
        }
      } else if (!node.hasOwnProperty(k)) {
        return false;
      } else if (pat[k] === node[k]) {
        null;
      } else {
        var m = matchone(pat[k], node[k], wilds);
        if (m) {
          wilds = m;
        } else {
          return false;
        }
      }
    }
    return wilds;
  } else if (pat.thisisa === "wildcard") {
    if (pat.id === null) {
      return true;
    } else if (wilds.hasOwnProperty(pat.id)) {
      return matchone(wilds[pat.id], node, wilds);
    } else {
      wilds[pat.id] = node;
      return wilds;
    }
  } else {
    return false;
  }
}
var ls = function(thing) {
  if (thing === null || thing === undefined) {
    return [];
  } else if (thing.constructor === Array) {
    return thing;
  } else {
    return [thing];
  }
}
var evalfn = function(fn, nodes, wilds) {
  var ret;
  switch (fn.thisisa) {
    case "merge":
      ret = {};
      $.each(
        $.map(copy_thing(fn.things), function(t) { return evalfn(t, nodes, wilds); }),
        function(i, obj) {
          for (k in obj) {
            if (ret[k] && ret[k].constructor === Array || obj[k].constructor === Array) {
              ret[k] = ls(ret[k]).concat(obj[k]);
            } else {
              ret[k] = obj[k];
            }
          }
        }
      );
      break;
    case "wildcard":
      ret = wilds[fn.id];
      break;
    case "noderef":
      ret = nodes[fn.node];
      break;
    default:
      if (fn.constructor === Array) {
        ret = [];
        for (var i = 0; i < fn.length; i++) {
          ret.push(evalfn(fn[i], nodes, wilds));
        }
      } else if (typeof fn === "object" && fn !== null) {
        ret = {};
        for (var k in fn) {
          ret[k] = evalfn(fn[k], nodes, wilds);
        }
      } else {
        ret = fn;
      }
  }
  return ret;
}
var applyfn = function(path, sen, fn) {
  var pre = copy_thing(sen.slice(0, path.nodes[0][0]));
  var post = copy_thing(sen.slice(path.nodes[path.nodes.length-1][0]+1));
  var app = [];
  for (var i = 0; i < path.nodes.length; i++) {
    app.push(copy_thing(sen[path.nodes[i][0]][path.nodes[i][1]]));
  }
  return pre.concat(evalfn(copy_thing(fn), app, copy_thing(path.wilds)), post);
}
var dosyntaxrule = function(insen, rule) {
  if (!rule) {
    return [];
  }
  var sen = insen.map(ls);
  var paths = [];
  for (var i = 0; i <= sen.length - rule.nodes.length; i++) {
    for (var j = 0; j < sen[i].length; j++) {
      var m = matchone(rule.nodes[0], sen[i][j], {});
      if (m) {
        paths.push({"nodes": [[i, j]], "wilds": m});
      }
    }
  }
  var temp = [];
  for (var i = 1; i < rule.nodes.length; i++) {
    for (var p in paths) {
      var w = paths[p].nodes[i-1][0] + i; //position of node being tested
      for (var n = 0; n < sen[w].length; n++) {
        var m = matchone(rule.nodes[i], sen[w][n], paths[p].wilds);
        if (m) {
          temp.push({"nodes": paths[p].nodes.concat([[w,n]]), "wilds": m});
        }
      }
    }
    paths = temp;
    temp = [];
  }
  var ret = [];
  for (var p in paths) {
    ret.push(applyfn(paths[p], sen, rule.function));
  }
  return ret;
}
var dosyntax = function(sen, lang, remdup) {
  var rules = langs[lang].syntax;
  var sens = [];
  var l = [];
  for (var k in rules) {
    l.push(k);
  }
  sens.push([sen, l]);
  var ret = [];
  while (sens.length > 0) {
    var s = sens.pop();
    if (s[1].length > 0) {
      sens.push([s[0], s[1].slice(1)]);
      var a = dosyntaxrule(s[0], rules[s[1][0]]);
      if (a.length > 0) {
        if (rules[s[1][0]].mandatory) {
          sens.pop();
        }
        var r = [s[1][0]].concat(rules[s[1][0]].next, s[1].slice(1));
        for (var x in a) {
          sens.push([a[x], r]);
        }
      }
    } else {
      if (remdup) {
        var notmatched = true;
        for (var i = 0; i < ret.length; i++) {
          if (objeq(ret[i], s[0])) {
            notmatched = false;
            break;
          }
        }
        if (notmatched) {
          ret.push(s[0]);
        }
      } else {
        ret.push(s[0]);
      }
    }
  }
  return ret;
}
var domorphologyrule = function(word, lang, ruleid) {
  if (!langs[lang].morphology.hasOwnProperty(ruleid)) {
    return [];
  }
  var rule = langs[lang].morphology[ruleid];
  switch (rule.thisisa) {
    case "load":
      var l = lists[lang][ruleid];
      if (l.constructor === Array) {
        for (var i = 0; i < l.length; i++) {
          if (typeof l[i] === "object") {
            if (word === l[i].is) {
              return [evalfn(rule.function, copy_thing([l[i]]), {})];
            }
          } else if (word === l[i]) {
            return [evalfn(rule.function, copy_thing([word]), {})];
          }
        }
      } else if (l.hasOwnProperty(word)) {
        var ret = copy_thing(ls(l[word]));
        for (var i = 0; i < ret.length; i++) {
          ret[i] = evalfn(rule.function, [ret[i]], {});
        }
        return ret;
      } break;
    case "morphologyrule":
      if (RegExp(rule.pat).test(word)) {
        var ret = [];
        var w = word.replace(RegExp(rule.pat), rule.replace);
        for (var i = 0; i < rule.next.length; i++) {
          $.each(domorphologyrule(w, lang, rule.next[i]), function(j, th) {
            ret.push(evalfn(rule.function, [th], {}));
          });
        } return ret;
      } break;
    case "litdict":
      if (rule.words.hasOwnProperty(word)) {
        var ret = copy_thing(ls(rule.words[word]));
        for (var i = 0; i < ret.length; i++) {
          ret[i] = evalfn(rule.function, [ret[i]], {});
        }
        return ret;
      } break;
    default:
      return [];
  }
  return [];
}
var domorphology = function(words, lang) {
  var ret = [];
  for (var i = 0; i < words.length; i++) {
    var p = [];
    for (var r in langs[lang].morphology) {
      p = p.concat(domorphologyrule(words[i], lang, r));
    }
    ret.push(p);
  }
  return ret;
}
