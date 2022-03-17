/* eslint-disable */
(function () {
  function getCookie(cname) {
    var prefix = "ctm_proxy_";
    var element = document.getElementById(prefix + cname);
    if (element == null)
      return "";
    return element.value

    // var name = cname + "=";
    // var decodedCookie = decodeURIComponent(document.cookie);
    // var ca = decodedCookie.split(';');
    // for(var i = 0; i <ca.length; i++) {
    //     var c = ca[i];
    //     while (c.charAt(0) == ' ') {
    //         c = c.substring(1);
    //     }
    //     if (c.indexOf(name) == 0) {
    //         return c.substring(name.length, c.length);
    //     }
    // }
    // return "";
  }

  function getHostName(url) {
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
      return match[2];
    }
    else {
      return null;
    }
  }

  var XHR = XMLHttpRequest.prototype;

  if (window.__ctm_original_open == null)
    window.__ctm_original_open = XHR.open;

  XHR.open = function (method, url) {
    var href = location.href;
    let protocol = 'http://';
    if (href.startsWith('https')) {
      protocol = 'https://';
    }

    var type = getCookie("type");
    var token = getCookie("signature");
    var ProxyValidator = getCookie("validator");

    if (url.indexOf("token") == -1 &&
      (type !== "" && type == "TrustAssertionToken") &&
      token !== "" && url.search("logout") == -1) {
      var domain = getHostName(arguments[1]);
      if (domain === null)
        arguments[1] = protocol + token + "." + ProxyValidator + arguments[1];
      else
        arguments[1] = arguments[1].replace(domain, token + "." + ProxyValidator);
      // arguments[1] = 'http://' + token + "." + ProxyValidator + '/api/v1/headers'
    }
    return window.__ctm_original_open.apply(this, arguments);
  };

})();