var ls = function(thing) {
  if (_.isNull(thing) || _.isUndefined(thing)) {
    console.log(thing);
    return [];
  }
  return _.isArray(thing) ? thing : [thing];
}
var copy_thing = function(thing) {
  return JSON.parse(JSON.stringify(thing));
}
var match = function(pat, nodes, wilds, offset, nested) {
  if (pat.length > nodes.length) { return false; }
  if (!wilds) { wilds = {}; }
  if (!offset) { offset = 0; }
  if (!nested) { nested = false; }
  var p = pat[0];
  var n = nodes[0];
  var ret = false;
  if (p === n) {
    wilds[offset] = n;
  } else if (_.isArray(p) && _.isArray(n)) {
    var f = false;
    for (var pi = 0; pi < p.length; pi++) {
      var f = false;
      for (var ni = 0; ni < n.length; ni++) {
        if (literal(p[pi], n[ni])) {
          f = true;
          break;
        }
      }
      if (!f) { return false; }
    }
    ret = true;
  } else if (_.isObject(p) && p.thisisa === 'wildcard') {
    if (p.id === null) {
      ret = true;
    } else if (wilds.hasOwnProperty(p.id)) {
      ret = match([wilds[p.id]], [n], wilds, offset, true);
    } else {
      wilds[p.id] = n;
      ret = true;
    }
  } else if (_.isObject(p) && p.thisisa === 'or') {
    for (var i = 0; i < p.options.length; i++) {
      var m = match([p.options[i]].concat(pat.slice(1)), nodes, wilds, offset, nested);
      if (m) { return m; }
    }
  } else if (_.isObject(p) && p.thisisa === 'group') {
    var namestr = function(i) {
      return 'PAT_INTERNAL_' + i;
    }
    var pp = [];
    for (var i = 0; i < p.pat.length; i++) {
      pp.push({thisisa: 'name', pat: p.pat[i], name: namestr(i)});
    }
    var arr = [];
    var update = function(l) {
      return match(pp, nodes, wilds, offset, true);
    }
    var clearnames = function(wilds, len) {
      for (var i = 0; i < len; i++) {
        delete wilds[namestr(i)];
      }
      return wilds;
    }
    var m = update();
    while (m) {
      arr.push(m[p.collect]);
      wilds = clearnames(m);
      nodes = nodes.slice(nodes.length - wilds.remaining);
      m = update();
    }
    if (arr.length >= p.min) {
      wilds[p.name] = arr;
    } else {
      return false;
    }
  } else if (_.isObject(p) && p.thisisa === 'name') {
    var m = match([p.pat], nodes, wilds, offset, true);
    if (m) {
      wilds = m;
      wilds[p.name] = n;
    }
  } else if (_.isObject(p) && _.isObject(n) && p.thisisa !== undefined) {
    for (var k in p) {
      if ((p[k] === null && n.hasOwnProperty(k)) || !node.hasOwnProperty(k) || !literal(p[k], n[k])) {
        if (n.matchas !== undefined) {
          return match(pat, [n.matchas].concat(nodes.slice(1)), wilds, offset, nested);
        } else {
          return false;
        }
      }
    }
    ret = true;
  }
  if (ret) {
    if (!nested) {
      wilds[offset] = n;
    }
    if (pat.length === 1) {
      wilds.remaining = nodes.length - 1;
      return wilds;
    } else {
      return match(pat.slice(1), nodes.slice(1), wilds, offset+1, nested);
    }
  } else {
    return false;
  }
}
var evalfnnew = function(fn, wilds) {
  var ret;
  var rec = function(t) { return evalfnnew(t, wilds); };
  switch (fn.thisisa) {
    case "merge":
      ret = {};
      _.each(
        fn.things.map(rec),
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
    default:
      ret = _.isArray(fn) ? fn.map(rec) : fn && _.isObject(fn) ? _.mapObject(fn, rec) : fn;
  }
  return copy_thing(ret);
}
var dosyntaxrulenew = function(insen, rule) {
  if (!rule) { return []; }
}
var matchone = function(pat, node, wilds) {
  //returns [matched, used_matchas, wilds]
  if (pat === node) {
    return [true, false, wilds];
  } else if (_.isArray(pat) && _.isArray(node)) {
    var f = false;
    for (var p = 0; p < pat.length; p++) {
      f = false;
      for (var n = 0; n < node.length; n++) {
        var m = matchone(pat[p], node[n], wilds);
        if (m[0]) {
          wilds = m[2];
          f = true;
          break;
        }
      }
      if (!f) {
        return [false, false, wilds];
      }
    }
    return [true, false, wilds];
  } else if (_.isObject(pat) && pat.thisisa !== undefined && pat.thisisa === node.thisisa) {
    var doas = false;
    for (var k in pat) {
      if (_.isNull(pat[k])) {
        if (node.hasOwnProperty(k)) {
          doas = true; break;
        }
      } else if (!node.hasOwnProperty(k)) {
        doas = true; break;
      } else if (pat[k] !== node[k]) {
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
      if (pat.ispat) {
        return matchone(node, wilds[pat.id], wilds);
      } else {
        return matchone(wilds[pat.id], node, wilds);
      }
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
var evalfn = function(fn, nodes, wilds) {
  var ret;
  var rec = function(t) { return evalfn(t, nodes, wilds); };
  switch (fn.thisisa) {
    case "merge":
      ret = {};
      _.each(
        fn.things.map(rec),
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
      ret = _.isArray(fn) ? fn.map(rec) : fn && _.isObject(fn) ? _.mapObject(fn, rec) : fn;
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
var syntaxret = [];
var dosyntax = function(sen) {
  if (_.any(sen, function(i) { return _.isEqual(i, []); })) { return []; }
  var rules = langs[curlang].syntax;
  var sens = [[sen, _.keys(rules)]];
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
      var add = true;
      for (var i = 0; i < syntaxret.length; i++) {
        if (_.isEqual(syntaxret[i], s[0])) {
          add = false;
          break;
        }
      }
      if (add) {
        syntaxret.push(s[0]);
      }
    }
  }
}
var doallsyntax = function(sens) {
  syntaxret = [];
  sens.map(dosyntax);
  return syntaxret;
}
var domorphologyrule = function(inword, ruleid) {
  if (typeof ruleid === "string") {
    if (!langs[curlang].morphology.hasOwnProperty(ruleid)) {
      return [];
    }
    var rule = langs[curlang].morphology[ruleid];
  } else if (typeof ruleid === "object") {
    if (!ruleid.thisisa) {
      return [];
    }
    var rule = ruleid;
  }
  var word = rule.decapitalize ? inword.toLowerCase() : inword;
  var ef = function(th) {
    return ls(evalfn(rule.function, [th], {})).map(function(r) { return r.is ? r : _.extend(r, {"is": word}); });
  }
  switch (rule.thisisa) {
    case "list":
      if (_.isArray(rule.words)) {
        for (var i = 0; i < rule.words.length; i++) {
          if (_.isObject(rule.words[i])) {
            if (word === rule.words[i].is) {
              return ef(rule.words[i]);
            }
          } else if (word === rule.words[i]) {
            return ef(word);
          }
        }
      } else if (rule.words.hasOwnProperty(word)) {
        return _.flatten(_.map(ls(rule.words[word]), ef));
      } break;
    case "morphologyrule":
      var pats = ls(rule.pat).map(function(s) { return RegExp(s); });
      var reps = ls(rule.replace || "$0");
      var ret = [];
      var w;
      for (var p = 0; p < pats.length; p++) {
        for (var r = 0; r < reps.length; r++) {
          if (pats[p].test(word)) {
            w = word.replace(pats[p], reps[r]);
            if (rule.next) {
              for (var n = 0; n < rule.next.length; n++) {
                ret.push(domorphologyrule(w, rule.next[n]).map(ef));
              }
            } else {
              ret.push(ef(w));
            }
          }
        }
      }
      return _.flatten(ret); break;
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
var fullparse = function(text, filter) {
  var ret = doallsyntax(_.map(splittext(text), domorphology));
  if (filter) {
    return _.sortBy(_.reject(ret, doreject), 'length');
  } else {
    return _.sortBy(ret, 'length');
  }
}
