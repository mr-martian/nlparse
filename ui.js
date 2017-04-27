var display = function(obj, edit, parent) {
  if (obj === null) {
    return null;
  }
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
      } else if (_.isString(obj) || _.isNumber(obj)) {
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
  e.target.parentNode.lastElementChild.style.display = {"": "none", "none": ""}[e.target.parentNode.lastElementChild.style.display]
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
