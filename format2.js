var display = function(obj, edit, parent) {
  var ret = "";
  var cls = obj.thisisa;
  var disp;
  if (obj.constructor === Array) {
    disp = obj.map(function(o) { return display(o, edit, "array"); });
  } else if (typeof obj === "object") {
    disp = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        disp[k] = display(obj[k], edit, obj.thisisa);
      }
    }
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
      ret = JSON.stringify(obj);
      break;
    case "grammar":
      ret = JSON.stringify(obj);
      break;
    case "langname":
      ret += '<table><tbody><tr><td>Code:</td><td>' + disp.code + '</td></tr>';
      ret += '<tr><td>Short Name:</td><td>' + disp.shortname + '</td></tr>';
      ret += '<tr><td>Long Name:</td><td>' + disp.longname + '</td></tr></tbody></table>';
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
        ret += '<tr><td><span class="key type">type</span></td><td>' + disp.type + '</td></tr>';
      }
      if ('is' in obj) {
        ret += '<tr><td><span class="key is">is</span></td><td>' + disp.is + '</td></tr>';
      }
      for (var k in obj) {
        if (k !== 'thisisa') {
          ret += '<tr><td><span class="key">' + k + '</span></td><td>' + disp[k] + '</td></tr>';
        }
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
      ret = JSON.stringify(obj);
      break;
    case "wildcard":
      ret = '<span class="wild">' + disp.id + '</span>';
      break;
    default:
      if (obj.constructor === Array) {
        ret = '<ul><li>' + disp.join('</li><li>') + '</li></ul>';
        cls = "list";
      } else if (typeof obj === "boolean") {
        cls = "boolean";
        ret = '<span class="bool">' + obj + '</span>';
      } else if (typeof obj === "string") {
        if (parent !== "node") {
          return obj;
        }
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
var dotypesel = function(e, par) {
  console.log(e.target.parentNode.parentNode);
  e.target.parentNode.parentNode.outerHTML = display({"thisisa": "want", "type": $('input[name="type-sel"]:checked').val()}, true, par);
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
  if (d.parentNode.tagName === "LI") {
    d = d.parentNode;
  } else if (d.parentNode.tagName === "TD") {
    d = d.parentNode.parentNode;
  }
  d.outerHTML = "";
}
