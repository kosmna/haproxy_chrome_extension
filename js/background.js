'use strict';

var DefaultSettings = {
  'active': true,
  'trust': false,
  'validation_token': '',
  'urls': ['*://*/*'],
  'exposedHeaders': '',
  },
  accessControlRequests = {};

var exposedHeaders;

var requestRules = [{
  'data': {
    'name': 'Access-Control-Request-Headers',
    'value': null
  },
  'mandatory': false,
  'fn': function (rule, header, details) {
    if(accessControlRequests[details.requestId] === void 0){
      accessControlRequests[details.requestId] = {};
    }
    accessControlRequests[details.requestId].headers = header.value;
  }
}];


var responseRules = [{
  'data': {
    'name': 'Access-Control-Allow-Origin',
    'value': '*'
  },
  'mandatory': true,
  'fn': null
}, {
  'data': {
    'name': 'Access-Control-Allow-Headers',
    'value': null
  },
  'mandatory': true,
  'fn': function (rule, header, details) {
    if(accessControlRequests[details.requestId] !== void 0){
      header.value = accessControlRequests[details.requestId].headers;
    }
  }
}, {
  'data': {
    'name': 'Access-Control-Allow-Credentials',
    'value': 'true'
  },
  'mandatory': false,
  'fn': null
}, {
  'data': {
    'name': 'Access-Control-Allow-Methods',
    'value': 'POST, GET, OPTIONS, PUT, DELETE'
  },
  'mandatory': true,
  'fn': null
},
  {
    'data': {
      'name': 'Allow',
      'value': 'POST, GET, OPTIONS, PUT, DELETE'
    },
    'mandatory': true,
    'fn': null
  }];

var requestListener = function (details) {
  console.info('request details', details);
  requestRules.forEach(function (rule) {
    var flag = false;

    details.requestHeaders.forEach(function (header) {
      if (header.name === rule.data.name) {
        flag = true;
        if (rule.fn) {
          rule.fn.call(null, rule, header, details);
        } else {
          header.value = rule.data.value;
        }
      }
    });

    //add this rule anyway if it's not present in request headers
    if (!flag && rule.mandatory) {
      if(rule.data.value){
        details.requestHeaders.push(rule.data);
      }
    }
  });

  return {
    requestHeaders: details.requestHeaders
  };
};

var responseListener = function (details) {
  console.info('response details', details);
  responseRules.forEach(function (rule) {
    var flag = false;

    details.responseHeaders.forEach(function (header) {
      // if rule exist in response - rewrite value
      if (header.name === rule.data.name) {
        flag = true;
        if (rule.fn) {
          rule.fn.call(null, rule.data, header, details);
        } else {
          if (rule.data.value) {
            header.value = rule.data.value;
          } else {
            //@TODO DELETE this header
          }
        }
      }
    });

    if (!flag && rule.mandatory) {
      if(rule.fn){
        rule.fn.call(null, rule.data, rule.data, details);
      }

      if (rule.data.value) {
        details.responseHeaders.push(rule.data);
      }
    }
  });
  return {
    responseHeaders: details.responseHeaders
  };
};

/*Reload settings*/
var reload = function () {
  chrome.storage.local.get(DefaultSettings,
    function (result) {
      exposedHeaders = result.exposedHeaders;

      /*Remove Listeners*/
      chrome.webRequest.onHeadersReceived.removeListener(responseListener);
      chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);
      if (result.active) {
        chrome.tabs.executeScript(null, {file: "js/injector.js"});        

        chrome.browserAction.setIcon({
          path: 'images/on.png'
        });

        if (result.urls.length) {
          /*Add Listeners*/
          chrome.webRequest.onHeadersReceived.addListener(responseListener, {
            urls: result.urls
          }, ['blocking', 'responseHeaders']);

          chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
            urls: result.urls
          }, ['blocking', 'requestHeaders']);
        }
      } else {
        chrome.tabs.executeScript(null, {file: 'js/remover.js'})
        chrome.browserAction.setIcon({
          path: 'images/off.png'
        });
      }
    });
};

chrome.runtime.onInstalled.addListener(function (details) {
  chrome.storage.local.set({
    'active': true
  });
  chrome.storage.local.set({
    'urls': ['*://*/*']
  });
  chrome.storage.local.set({
    'exposedHeaders': ''
  });
  reload();
});

var pollInterval = 1000 * 10;
var request_domain;
function pollCookie()
{
    chrome.cookies.getAll({domain: request_domain}, function(cookies) {
      var type="", signature="", validator="";
      var i=0;
      for(i=0; i<cookies.length; i++) {
        var cookie = cookies[i];
        if(cookie.name=="type")
          type = cookie.value;

        if(cookie.name=="Signature")
          signature = cookie.value;

        if(cookie.name=="ProxyValidator")
          validator = cookie.value;
      }
      chrome.tabs.query({ active: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { "message": {status: "reset", type: type, signature: signature, validator: validator} });
        });
    });

    setTimeout(pollCookie, pollInterval);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.type=="getCookies")
  {
    request_domain = request.domain;

    chrome.cookies.getAll({domain: request.domain}, function(cookies) {
      var domain = request.domain;
      var type="", signature="", validator="";
      var i=0;
      for(i=0; i<cookies.length; i++) {
        var cookie = cookies[i];
        if(cookie.name=="type")
          type = cookie.value;

        if(cookie.name=="Signature")
          signature = cookie.value;

        if(cookie.name=="ProxyValidator")
          validator = cookie.value;
      }

      chrome.cookies.onChanged.addListener(function(changeInfo){
        if(changeInfo.cookie.domain==domain)
        {
          var message = {status: "changed", removed: changeInfo.removed, type: "", signature: "", validator: "" };

          var cookie = changeInfo.cookie;
          message.name = cookie.name;

          if(cookie.name=="type")
            message.type = cookie.value

          if(cookie.name=="Signature")
            message.signature = cookie.value;

          if(cookie.name=="ProxyValidator")
            message.validator = cookie.value;

          chrome.tabs.query({ active: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { "message": message });
          });
        }
      });


      chrome.tabs.query({ active: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { "message": {status: "reset", type: type, signature: signature, validator: validator} });
        });

      window.setTimeout(pollCookie, pollInterval)
    });
  }
  else if(request.type=="removeCookies")
  {
    chrome.cookies.getAll({domain: request.domain}, function(cookies) {
      for(var i=0; i<cookies.length;i++) {
          chrome.cookies.remove({url: "http" + (cookies[i].secure ? "s" : "") + "://" + cookies[i].domain + cookies[i].path, name: cookies[i].name});
      }
    });
  }
});