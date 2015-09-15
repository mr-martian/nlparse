var display = function(obj, edit) {
  var ret = "";
  var cls = "";
  switch (obj.thisisa) {
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
          ret += '<tr><td><span class="key type">' + k + '</span></td><td>';
          ret += display(obj[k], edit);
          ret += '</td></tr>';
        }
      }
      ret += '</tbody></table>';
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
  var ret;
  switch (div.className) {
    case "List":
      ret = [];
      for (var i = 0; i < div.childNodes.length; i++) {
        if (div.childNodes[i].tagName === "ul") {
          for (var j = 0; j < div.childNodes[i].childNodes.length; j++) {
            ret.push(parsediv(div.childNodes[i].childNodes[j]));
          }
        }
      } break;
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
