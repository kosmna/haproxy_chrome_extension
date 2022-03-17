(function() {
      var XHR = XMLHttpRequest.prototype;
      
      if (window.__ctm_original_open == null)
        window.__ctm_original_open = XHR.open;

      XHR.open = function(method, url) {
        return window.__ctm_original_open.apply(this, arguments);
      };
  })();