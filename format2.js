var display = function(obj, edit) {
  var ret = "";
  var cls = obj.thisisa;
  switch (obj.thisisa) {
    case "function":
      ret = JSON.stringify(obj);
      break;
    case "grammar":
      ret = JSON.stringify(obj);
      break;
    case "langname":
      ret = JSON.stringify(obj);
      break;
    case "litdict":
      ret = JSON.stringify(obj);
      break;
    case "load":
      ret = JSON.stringify(obj);
      break;
    case "morphologyrule":
      ret = JSON.stringify(obj);
      break;
    case "node":
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
      ret = '<span class="wildcard">' + obj.id + '</span>';
      break;
    case "or":
      ret = '<ul>';
      for (var i = 0; i < obj.options.length; i++) {
        ret += '<li>' + display(obj.options[i], edit) + '</li>';
      }
      ret += '</ul>';
      break;
    case "syntaxrule":
      ret = JSON.stringify(obj);
      break;
    case "wildcard":
      ret = '<span class="wild">' + obj.id + '</span>';
      break;
    default:
      if (obj.constructor === Array) {
        ret = '<ul>';
        cls = "list";
        for (var i = 0; i < obj.length; i++) {
          ret += '<li>' + display(obj[i], edit) + '</li>';
        }
        ret += '</ul>';
      } else if (typeof obj === "boolean") {
        cls = "boolean";
        ret = '<span class="bool">' + obj + '</span>';
      } else if (typeof obj === "string") {
        cls = "symbol";
        ret = '<span class="value">' + obj + '</span>';
      } else {
        ret = JSON.stringify(obj);
      }
  }
  var s = '<div class="' + cls + '"><span class="header">' + cls + '</span><span class="showhide" onclick="showhide(event);">Show/Hide</span>';
  if (edit) {
    return s + '<span class="delete" onclick="delthing(event);">Delete</span><br>' + ret + '</div>';
  } else {
    return s + '<br>' + ret + '</div>';
  }
}
var showhide = function(e) {
  switch (e.target.parentNode.lastChild.style.display) {
    case "none":
      e.target.parentNode.lastChild.style.display = "";
      break;
    default:
      e.target.parentNode.lastChild.style.display = "none";
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
  var ret = {
    "thisisa": div.className
  };
  switch (div.className) {
    case "boolean":
      if (div.getElementsByClassName('bool')[0].innerHTML === "true") {
        ret = true;
      } else {
        ret = false;
      }
      break;
    case "function":
      break;
    case "grammar":
      break;
    case "langname":
      break;
    case "list":
      ret = dochild(div, "UL", function(t) {
        return parsediv(t.firstChild);
      });
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
          ret[tr.firstChild.firstChild.innerHTML] = parsediv(tr.childNodes[1].firstChild);
        });
      });
      break;
    case "noderef":
      break;
    case "or":
      ret = {
        "thisisa": "or",
        "options": dochild(div, "UL", function(t) {
          return parsediv(t.firstChild);
        })
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
