var display = function(obj, edit) {
  var ret = "";
  var cls = "";
  switch (obj.thisisa) {
    case "function":
      cls = "Function";
      ret = JSON.stringify(obj);
      break;
    case "grammar":
      cls = "Grammar";
      ret = JSON.stringify(obj);
      break;
    case "langname":
      cls = "Langname";
      ret = JSON.stringify(obj);
      break;
    case "litdict":
      cls = "Litdict";
      ret = JSON.stringify(obj);
      break;
    case "load":
      cls = "Load";
      ret = JSON.stringify(obj);
      break;
    case "morphologyrule":
      cls = "Morphologyrule";
      ret = JSON.stringify(obj);
      break;
    case "node":
      cls = "Node";
      ret = '<table><tbody>';
      if ('type' in obj) {
        ret += '<tr><td><span class="key type">type</span></td><td>';
        ret += display(obj.type, edit);
        ret += '</td></tr>';
      }
      if ('is' in obj) {
        ret += '<tr><td><span class="key is">is</span></td><td>';
        ret += display(obj.is, edit);
        ret += '</td></tr>';
      }
      for (var k in obj) {
        if (k !== 'is' && k !== 'type' && k !== 'thisisa') {
          ret += '<tr><td><span class="key">' + k + '</span></td><td>';
          ret += display(obj[k], edit);
          ret += '</td></tr>';
        }
      }
      ret += '</tbody></table>';
      break;
    case "noderef":
      cls = "Noderef";
      ret = '<span class="wildcard">' + obj.id + '</span>';
      break;
    case "or":
      cls = "Or";
      ret = '<ul>';
      for (var i = 0; i < obj.options.length; i++) {
        ret += '<li>' + display(obj.options[i], edit) + '</li>';
      }
      ret += '</ul>';
      break;
    case "syntaxrule":
      cls = "Syntaxrule";
      ret = JSON.stringify(obj);
      break;
    case "wildcard":
      cls = "Wildcard";
      ret = '<span class="wild">' + obj.id + '</span>';
      break;
    default:
      if (obj.constructor === Array) {
        ret = '<ul>';
        cls = "List";
        for (var i = 0; i < obj.length; i++) {
          ret += '<li>' + display(obj[i], edit) + '</li>';
        }
        ret += '</ul>';
      } else if (typeof obj === "boolean") {
        cls = "Boolean";
        ret = '<span class="bool">' + obj + '</span>';
      } else if (typeof obj === "string") {
        cls = "Symbol";
        ret = '<span class="value">' + obj + '</span>';
      } else {
        ret = JSON.stringify(obj);
      }
  }
  var s = '<div class="' + cls + '"><span class="header">' + cls + '</span>';
  if (edit) {
    return s + '<span class="delete" onclick="delthing(event);">Delete</span><br>' + ret + '</div>';
  } else {
    return s + '<br>' + ret + '</div>';
  }
}
var parsediv = function(div) {
  var dochild = function(d, tag, fn) {
    var ret = [];
    for (var i = 0; i < d.childNodes.length; i++) {
      if (d.childNodes[i].tagName === tag) {
        var n = d.childNodes[i].childNodes;
        for (var j = 0; j < n.length; j++) {
          ret.push(fn(n[j]));
        }
      }
    }
    return ret;
  };
  var ret = {};
  switch (div.className) {
    case "Boolean":
      if (div.getElementsByClassName('bool')[0].innerHTML === "true") {
        ret = true;
      } else {
        ret = false;
      }
      break;
    case "Function":
      ret = {
        "thisisa": "function"
      };
      break;
    case "Grammar":
      ret = {
        "thisisa": "grammar"
      };
      break;
    case "Langname":
      ret = {
        "thisisa": "langname"
      };
      break;
    case "List":
      ret = dochild(div, "UL", function(t) {
        return parsediv(t.firstChild);
      });
      break;
    case "Litdict":
      ret = {
        "thisisa": "litdict"
      };
      break;
    case "Load":
      ret = {
        "thisisa": "load"
      };
      break;
    case "Morphologyrule":
      ret = {
        "thisisa": "morphologyrule"
      };
      break;
    case "Node":
      ret = {"thisisa": "node"};
      dochild(div, "TABLE", function(t) {
        $.each(t.childNodes, function(i, tr) {
          ret[tr.firstChild.firstChild.innerHTML] = parsediv(tr.childNodes[1].firstChild);
        });
      });
      break;
    case "Noderef":
      ret = {
        "thisisa": "noderef"
      };
      break;
    case "Or":
      ret = {
        "thisisa": "or",
        "options": dochild(div, "UL", function(t) {
          return parsediv(t.firstChild);
        })
      };
      break;
    case "Symbol":
      ret = div.getElementsByClassName('value')[0].innerHTML;
      break;
    case "Syntaxrule":
      ret = {
        "thisisa": "syntaxrule"
      };
      break;
    case "Wildcard":
      ret = {
        "thisisa": "wildcard"
      };
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
  if (d.parentNode.tagName === "li") {
    d = d.parentNode;
  }
  d.outerHTML = "";
}
