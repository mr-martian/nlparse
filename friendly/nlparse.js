var copy = function(thing) {
  return JSON.parse(JSON.stringify(thing));
}
var matchone = function(pat, node, wilds) {
  if (pat === node) {
    return wilds;
  } else if (pat.thisisa === node.thisisa && typeof pat === "object") {
    //if they're both undefined, this will cover arrays as well
    for (var k in pat) {
      if (pat[k] === null) {
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
    if (wilds.hasOwnProperty(pat.id)) {
      return (node === wilds[wilds[pat.id]]) && wilds;
    } else {
      wilds[pat.id] = node;
      return wilds;
    }
  } else {
    return false;
  }
}
var ls = function(thing) {
  if (thing.constructor === Array) {
    return thing;
  } else {
    return [thing];
  }
}
var evalfn = function(fn, nodes, wilds) {
  var ret;
  switch (fn.thisisa) {
    case "function":
      switch (fn.function) {
        case "set":
          ret = evalfn(fn.node, nodes, wilds);
          ret[fn.key] = evalfn(fn.val, nodes, wilds);
          break;
        case "add":
          ret = evalfn(fn.node, nodes, wilds);
          ret[fn.key] = (ret[fn.key] || []).concat(evalfn(fn.val, nodes, wilds));
          break;
        default:
          ret = nodes;
      }
      break;
    case "wildcard":
      ret = wilds[fn.id];
      break;
    case "noderef":
      ret = nodes[fn.node];
      break;
    default:
      if (typeof fn === "object" && fn !== null) {
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
  var pre = copy(sen.slice(0, path.nodes[0][0]));
  var post = copy(sen.slice(path.nodes[path.nodes.length-1][0]+1));
  var app = [];
  for (var i = 0; i < path.nodes.length; i++) {
    app.push(copy(sen[path.nodes[i][0]][path.nodes[i][1]]));
  }
  return pre.concat(evalfn(copy(fn), app, copy(path.wilds)), post);
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
var dosyntax = function(sen, rules) {
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
      ret.push(s[0]);
    }
  }
  return ret;
}
