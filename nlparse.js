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
        r = {"thisisa": "merge", "things": subparse(t)};
        break;
      case '?':
        t.shift();
        r = {"thisisa": "syntaxrule"}
        if (t[0] === '!') {
          r.mandatory = true;
          t.shift();
        }
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
        while (t.length > 0 && t[0].match(/^[a-z0-9\-]/)) { r += t.shift(); }
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
  } else if (typeof thing === "object" && thing !== null) {
    return _.mapObject(thing, function(v, k) {
      if ((thing.thisisa === "morphologyrule" && k !== "function") || thing.thisisa === "wordify") {
        return v;
      } else {
        return parsetree(v);
      }
    });
  } else {
    return thing;
  }
}
langs = {};
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
waiting = 0;
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
  if (_.isEqual(pat, node)) {
    return wilds;
  } else if (pat.thisisa === node.thisisa && typeof pat === "object") {
    //if they're both undefined, this will cover arrays as well
    for (var k in pat) {
      if (pat[k] && pat[k].thisisa === "or") {
        for (var i = 0; i < pat[k].options.length; i++) {
          var pp = copy_thing(pat);
          pp[k] = pat[k][i];
          var m = matchone(pp, node, wilds);
          if (m) {
            return m;
          }
        }
        return false;
      } else if (_.isNull(pat[k])) {
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
  if (_.isNull(thing) || _.isUndefined(thing)) {
    return [];
  } else if (_.isArray(thing)) {
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
      _.each(
        _.map(fn.things, function(t) { return evalfn(t, nodes, wilds); }),
        function(obj) {
          for (k in obj) {
            if (ret[k] && _.isArray(ret[k]) || _.isArray(obj[k])) {
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
  return _.map(paths, function(path) {
    var pre = copy_thing(sen.slice(0, path.nodes[0][0]));
    var post = copy_thing(sen.slice(path.nodes[path.nodes.length-1][0]+1));
    var app = [];
    var app = _.map(path.nodes, function(n) { return sen[n[0]][n[1]]; });
    return pre.concat(evalfn(rule.function, app, copy_thing(path.wilds)), post);
  });
}
var dosyntax = function(sen, lang, remdup) {
  var rules = langs[lang].syntax;
  var sens = [[sen, _.keys(rules)]];
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
          if (_.isEqual(ret[i], s[0])) {
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
var domorphologyrule = function(inword, lang, ruleid) {
  if (!langs[lang].morphology.hasOwnProperty(ruleid)) {
    return [];
  }
  var rule = langs[lang].morphology[ruleid];
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
        return _.flatten(_.map(rule.next, function(rl) { return _.map(domorphologyrule(w, lang, rl), ef); }));
      } break;
    default:
      return [];
  }
  return [];
}
var domorphology = function(words, lang) {
  return _.map(
    words,
    function(w) {
      return _.map(
        _.flatten(_.map(_.keys(langs[lang].morphology), function(r) { return domorphologyrule(w, lang, r); })),
        function(n) { return _.extend(n, {"lang": lang}); }
      )
    }
  );
}
var splittext = function(text, lang) {
  var pats = _.map(langs[lang].wordify.words, function(w) { return new RegExp('^' + w); });
  var skip = new RegExp('^' + langs[lang].wordify.skip, 'g');
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
var fullparse = function(text, lang) {
  var l = splittext(text, lang);
  var ret = _.flatten(_.map(l, function(w) { return dosyntax(domorphology(w, lang), lang, true); }));
  return _.filter(ret, function(it) { return _.any(it, function(x) { return !_.isEqual(x, []); }); });
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
    return _.flatten(_.map(d.childNodes, function(n) { return n.tagName === tag ? _.map(n.childNodes, fn) : []; }));
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
