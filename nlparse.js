var copy_thing = function(thing) {
  return JSON.parse(JSON.stringify(thing));
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
      default:
        r = "";
        while (t.length > 0 && t[0].match(/^[a-zA-Z0-9\-]/)) { r += t.shift(); }
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
      return (thing.thisisa === "morphologyrule" && k !== "function") || thing.thisisa === "wordify" ? v : parsetree(v);
    });
  } else {
    return thing;
  }
}
var langs = {};
var curlang;
var loadlib = function(lang, k, fn) {
  if (langs[lang].morphology[k].hasOwnProperty("words")) {
    fn(langs[lang].morphology[k].words);
  } else {
    $.getJSON("langs/" + lang + "/" + langs[lang].morphology[k].file, function(s) {
      langs[lang].morphology[k].words = s;
      fn(s);
    });
  }
}
var waiting = 0;
var loadlang = function(lang, fn) {
  if (langs.hasOwnProperty(lang)) {
    fn(langs[lang]);
  } else {
    waiting += 1;
    $.getJSON("langs/" + lang + "/main.json", function(stuff) {
      waiting -= 1;
      langs[lang] = parsetree(stuff);
      for (var k in langs[lang].morphology) {
        if (langs[lang].morphology[k].thisisa === "list" && langs[lang].morphology[k].file) {
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
    _.map(stuff, function(i) { loadlang(i.code, _.noop) });
  });
}
var matchone = function(pat, node, wilds) {
  //returns [matched, used_matchas, wilds]
  if (_.isEqual(pat, node)) {
    return [true, false, wilds];
  } else if (_.isObject(pat) && pat.thisisa === node.thisisa) {
    //if they're both undefined, this will cover arrays as well
    //though arrays are kind of supposed to represent unordered collections, so maybe not?
    var doas = false;
    for (var k in pat) {
      if (_.isNull(pat[k])) {
        if (node.hasOwnProperty(k)) {
          doas = true; break;
        }
      } else if (!node.hasOwnProperty(k)) {
        doas = true; break;
      } else if (pat[k] === node[k]) {
        null;
      } else {
        var m = matchone(pat[k], node[k], wilds);
        if (m[0]) {
          wilds = m[2];
        } else {
          doas = true; break;
        }
      }
    }
    if (!doas) {
      return [true, false, wilds];
    } else if (node.matchas) {
      var m = matchone(pat, node.matchas, wilds);
      return [m[0], true, m[2]];
    } else {
      return [false, false, wilds];
    }
  } else if (_.isObject(pat) && pat.thisisa === "wildcard") {
    if (pat.id === null) {
      return [true, false, wilds];
    } else if (wilds.hasOwnProperty(pat.id)) {
      return matchone(wilds[pat.id], node, wilds);
    } else {
      wilds[pat.id] = node;
      return [true, false, wilds];
    }
  } else if (pat.thisisa === "or") {
    for (var i = 0; i < pat.options.length; i++) {
      var m = matchone(pat.options[i], node, wilds);
      if (m[0]) { return m; }
    }
    return [false, false, wilds];
  } else {
    return [false, false, wilds];
  }
}
var ls = function(thing) {
  if (_.isNull(thing) || _.isUndefined(thing)) {
    return [];
  }
  return _.isArray(thing) ? thing : [thing];
}
var evalfn = function(fn, nodes, wilds) {
  var ret;
  switch (fn.thisisa) {
    case "merge":
      ret = {};
      _.each(
        _.map(fn.things, function(t) { return evalfn(t, nodes, wilds); }),
        function(obj) {
          for (k in obj) {
            if (!fn.override && ret[k] && _.isArray(ret[k]) || _.isArray(obj[k])) {
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
      if (_.isArray(fn)) {
        ret = _.map(fn, function(i) { return evalfn(i, nodes, wilds); });
      } else if (_.isObject(fn) && fn !== null) {
        ret = _.mapObject(fn, function(i) { return evalfn(i, nodes, wilds); });
      } else {
        ret = fn;
      }
  }
  return copy_thing(ret);
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
      if (m[0]) {
        paths.push({"nodes": [[i, j]], "wilds": m[2]});
      }
    }
  }
  var temp = [];
  for (var i = 1; i < rule.nodes.length; i++) {
    for (var p = 0; p < paths.length; p++) {
      var w = paths[p].nodes[0][0] + i; //position of node being tested
      for (var n = 0; n < sen[w].length; n++) {
        var m = matchone(rule.nodes[i], sen[w][n], paths[p].wilds);
        if (m[0]) {
          temp.push({"nodes": paths[p].nodes.concat([[w, n]]), "wilds": m[2]});
        }
      }
    }
    paths = temp;
    temp = [];
  }
  return _.map(paths, function(path) {
    var pre = copy_thing(sen.slice(0, path.nodes[0][0]));
    var post = copy_thing(sen.slice(path.nodes[path.nodes.length-1][0]+1));
    var app = _.map(path.nodes, function(n) { return sen[n[0]][n[1]]; });
    return pre.concat(evalfn(rule.function, app, copy_thing(path.wilds)), post);
  });
}
var dosyntax = function(sen, keepdup) {
  if (_.any(sen, function(i) { return _.isEqual(i, []); })) { return []; }
  var rules = langs[curlang].syntax;
  var sens = [[sen, _.keys(rules)]];
  var ret = [];
  while (sens.length > 0) {
    var s = sens.pop();
    if (s[1].length > 0) {
      sens.push([s[0], s[1].slice(1)]);
      var a = dosyntaxrule(s[0], rules[s[1][0]]);
      if (a.length > 0) {
        var r = [s[1][0]].concat(rules[s[1][0]].next, s[1].slice(1));
        for (var x in a) {
          sens.push([a[x], r]);
        }
      }
    } else {
      if (keepdup) {
        ret.push(s[0]);
      } else {
        var notmatched = true;
        for (var i = 0; i < ret.length; i++) {
          if (_.isEqual(ret[i], s[0])) {
            notmatched = false;
            break;
          }
        }
        if (notmatched) {
          ret.push(s[0]);
        }
      }
    }
  }
  return ret;
}
var domorphologyrule = function(inword, ruleid) {
  if (!langs[curlang].morphology.hasOwnProperty(ruleid)) {
    return [];
  }
  var rule = langs[curlang].morphology[ruleid];
  var word = inword;
  if (rule.decapitalize) {
    word = inword.toLowerCase();
  }
  var ef = function(th) {
    return evalfn(rule.function, [th], {});
  }
  switch (rule.thisisa) {
    case "list":
      if (_.isArray(rule.words)) {
        for (var i = 0; i < rule.words.length; i++) {
          if (_.isObject(rule.words[i])) {
            if (word === rule.words[i].is) {
              return [ef(rule.words[i])];
            }
          } else if (word === rule.words[i]) {
            return [ef(word)];
          }
        }
      } else if (rule.words.hasOwnProperty(word)) {
        return _.map(ls(rule.words[word]), ef);
      } break;
    case "morphologyrule":
      if (RegExp(rule.pat).test(word)) {
        var w = word.replace(RegExp(rule.pat), rule.replace);
        return _.flatten(_.map(rule.next, function(rl) { return _.map(domorphologyrule(w, rl), ef); }));
      } break;
    default:
      return [];
  }
  return [];
}
var domorphology = function(words) {
  return _.map(
    words,
    function(w) {
      return _.map(
        _.flatten(_.map(_.keys(langs[curlang].morphology), function(r) { return domorphologyrule(w, r); })),
        function(n) { return _.extend(n, {"lang": curlang}); }
      );
    }
  );
}
var splittext = function(text) {
  var pats = _.map(langs[curlang].wordify.words, function(w) { return new RegExp('^' + w); });
  var skip = new RegExp('^' + langs[curlang].wordify.skip, 'g');
  var ret = [];
  var cur = [{"tx": text, "words": []}];
  while (cur.length > 0) {
    var c = cur.pop();
    if (c.tx === "") {
      ret.push(c.words);
    } else if (skip.exec(c.tx)) {
      cur.push({"tx": c.tx.slice(skip.lastIndex), "words": c.words});
      skip.lastIndex = 0;
    } else {
      for (var i = 0; i < pats.length; i++) {
        var m = c.tx.match(pats[i]);
        if (m) {
          cur.push({"tx": c.tx.slice(m[0].length), "words": _.flatten([copy_thing(c.words), m[0]])});
        }
      }
    }
  }
  return ret;
}
var doreject = function(sen) {
  return _.any(_.flatten(sen), function(n) {
    return _.any(langs[curlang].reject, function(p) {
      return matchone(p, n, {})[0];
    })
  });
}
var fullparse = function(text) {
  return _.sortBy(_.reject(_.flatten(_.map(_.map(splittext(text), domorphology), dosyntax), true), doreject), 'length');
}
var display = function(obj, edit, parent) {
  var ret = JSON.stringify(obj);
  var cls = obj.thisisa;
  var disp;
  if (_.isArray(obj)) {
    disp = obj.map(function(o) { return display(o, edit, "array"); });
  } else if (_.isObject(obj)) {
    disp = _.mapObject(obj, function(v) { return display(v, edit, obj.thisisa); });
  } else {
    disp = obj;
  }
  switch (obj.thisisa) {
    case "want":
      if (edit) {
        switch (obj.type) {
          case "key":
            ret = '<span>WANT KEY</span>';
            break;
          case "node":
            cls = "node";
            var v = display({"thisisa": "want", "type": "type", "typs": ["merge", "node", "noderef", "or", "wildcard"]}, edit, obj.thisisa);
            ret = '<table><tbody><tr><td><span class="key type">type</span></td><td>' + v + '</td></tr><tr><td>';
            ret += '<span class="key is">is</span></td><td>' + v + '</td></tr><tr><td>';
            ret += display({"thisisa": "want", "type": "key"}, edit, obj.thisisa);
            ret += '</td><td>' + v + '</td></tr></tbody></table>';
            break;
          case "string":
            ret = '<span>WANT STRING</span>';
            break;
          case "type":
            ret = '<div class="select">';
            ret += obj.typs.map(function(t) { return '<input type="radio" name="type-sel" value="' + t + '">' + t + '</input>'; }).join('');
            ret += '<button onclick="dotypesel(event, \'' + parent + '\');">Select</button></div>';
            break;
          default:
            ret = '<span class="err">Unknown Want Type "' + obj.type + '"</span>';
        }
      } else {
        ret = '<span class="want-type">Unset ' + obj.type + '</span>';
      } break;
    case "function":
      break;
    case "grammar":
      break;
    case "langname":
      ret = '<table><tbody><tr><td>Code:</td><td>' + disp.code + '</td></tr>';
      ret += '<tr><td>Short Name:</td><td>' + disp.shortname + '</td></tr>';
      ret += '<tr><td>Long Name:</td><td>' + disp.longname + '</td></tr></tbody></table>';
      break;
    case "list":
      break;
    case "morphologyrule":
      break;
    case "node":
      ret = '<table><tbody>';
      if ('type' in obj) {
        ret += '<tr><td><span class="key type">type</span></td><td>' + disp.type + '</td></tr>';
      }
      if ('is' in obj) {
        ret += '<tr><td><span class="key is">is</span></td><td>' + disp.is + '</td></tr>';
      }
      for (var k in _.omit(obj, 'thisisa', 'type', 'is')) {
        ret += '<tr><td><span class="key">' + k + '</span></td><td>' + disp[k] + '</td></tr>';
      }
      ret += '</tbody></table>';
      break;
    case "noderef":
      ret = '<span class="wildcard">' + disp.id + '</span>';
      break;
    case "or":
      ret = '<ul><li>' + disp.options.join('</li><li>') + '</li></ul>';
      break;
    case "syntaxrule":
      break;
    case "wildcard":
      ret = '<span class="wild">' + disp.id + '</span>';
      break;
    case "wordify":
      break;
    default:
      if (_.isArray(obj)) {
        ret = '<ul><li>' + disp.join('</li><li>') + '</li></ul>';
        cls = "list";
      } else if (_.isBoolean(obj)) {
        cls = "boolean";
        ret = '<span class="bool">' + obj + '</span>';
      } else if (_.isString(obj)) {
        if (parent !== "node") {
          return obj;
        }
        cls = "symbol";
        ret = '<span class="value">' + obj + '</span>';
      }
  }
  var s = '<div class="' + cls + '"><span class="header">' + cls + '</span><span class="showhide" onclick="showhide(event);">Show/Hide</span>';
  if (edit) {
    return s + '<span class="delete" onclick="delthing(event);">Delete</span><br>' + ret + '</div>';
  } else {
    return s + '<br>' + ret + '</div>';
  }
}
var dotypesel = function(e, par) {
  e.target.parentNode.parentNode.outerHTML = display({"thisisa": "want", "type": $('input[name="type-sel"]:checked').val()}, true, par);
}
var showhide = function(e) {
  e.target.parentNode.lastChild.style.display = {"": "none", "none": ""}[e.target.parentNode.lastChild.style.display]
}
var parsediv = function(div) {
  var dochild = function(d, tag, fn) {
    return _.flatten(_.map(d.childNodes, function(n) { return n.tagName === tag ? _.map(n.childNodes, fn) : []; }), true);
  };
  var pd1st = function(n) { return parsediv(n.firstChild); }
  var ret = {
    "thisisa": div.className
  };
  switch (div.className) {
    case "boolean":
      ret = div.getElementsByClassName('bool')[0].innerHTML === "true" ? true : false;
      break;
    case "function":
      break;
    case "grammar":
      break;
    case "langname":
      break;
    case "list":
      ret = dochild(div, "UL", pd1st);
      break;
    case "litdict":
      break;
    case "load":
      break;
    case "morphologyrule":
      break;
    case "node":
      dochild(div, "TABLE", function(t) {
        $.each(t.childNodes, function(i, tr) {
          ret[tr.firstChild.firstChild.innerHTML] = pd1st(tr.childNodes[1]);
        });
      });
      break;
    case "noderef":
      break;
    case "or":
      ret = {
        "thisisa": "or",
        "options": dochild(div, "UL", pd1st)
      };
      break;
    case "symbol":
      ret = div.getElementsByClassName('value')[0].innerHTML;
      break;
    case "syntaxrule":
      break;
    case "wildcard":
      ret.id = div.getElementsByClassName('wild')[0].innerHTML;
      break;
    case "wordify":
      break;
    default:
      ret = {
        "thisisa": "unknown"
      };
  }
  return ret;
}
var delthing = function(e) {
  var d = e.target.parentNode;
  if (d.parentNode.tagName === "LI") {
    d = d.parentNode;
  } else if (d.parentNode.tagName === "TD") {
    d = d.parentNode.parentNode;
  }
  d.outerHTML = "";
}
