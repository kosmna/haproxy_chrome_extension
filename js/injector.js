function remove(id) {
    var elem = document.getElementById(id);
    if (elem != null)
        return elem.parentNode.removeChild(elem);
}

function injectRedirectViaProxyCode(){
    var script_id = 'ctm_proxy_demo';
    var nacl_script_id = 'ctm_proxy_nacl';
    var type_id = 'ctm_proxy_type';
    var signature_id = 'ctm_proxy_signature';
    var validator_id = 'ctm_proxy_validator';

    remove(script_id);

    // var xmlHttp = null;
    // xmlHttp = new XMLHttpRequest();
    // xmlHttp.open( "GET", chrome.extension.getURL ("js/script-xhr-modify.js"), false );
    // xmlHttp.send( null );
    remove(script_id);

    var inject  = document.createElement("script");
    inject.setAttribute("id", script_id);
    inject.src = chrome.extension.getURL ("js/script-xhr-modify.js");
    // var code = xmlHttp.responseText;
    // inject.innerHTML = code;
    document.body.appendChild (inject, document.body.firstChild);

    var link = document.createElement('a');
    link.href = window.location;
    var domain = link.hostname;

    chrome.runtime.sendMessage({ domain: domain, type: "getCookies" }, function(response) {
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        var message = request.message;
        var type = message.type;
        var signature = message.signature;
        var validator = message.validator;
        
        if(message.status=="reset")
        {
            var typeEle  = document.getElementById(type_id);
            if(typeEle==null)
            {                
                typeEle = document.createElement("input");
                document.body.appendChild (typeEle, document.body.firstChild);
            }
            typeEle.setAttribute("id", type_id);
            typeEle.setAttribute("type", "hidden");
            typeEle.setAttribute("value", type);

            var signatureEle = document.getElementById(signature_id);
            if(signatureEle==null)
            {
                signatureEle = document.createElement("input");
                document.body.appendChild (signatureEle, document.body.firstChild);
            }
            signatureEle.setAttribute("id", signature_id);
            signatureEle.setAttribute("type", "hidden");
            signatureEle.setAttribute("value", signature);

            var validatorEle  = document.getElementById(validator_id);
            if(validatorEle==null)
            {
                validatorEle = document.createElement("input");
                document.body.appendChild (validatorEle, document.body.firstChild);
            }
            validatorEle.setAttribute("id", validator_id);
            validatorEle.setAttribute("type", "hidden");
            validatorEle.setAttribute("value", validator);
        }
        else if(message.status=="changed")
        {
            var typeEle = document.getElementById(type_id);
            var signatureEle = document.getElementById(signature_id);
            var validatorEle = document.getElementById(validator_id);

            if(message.name=="type")
            {
                if(message.removed)
                    typeEle.value = "";
                else
                    typeEle.value = message.type;
            }

            if(message.name=="Signature")
            {
                document.cookie = "RequiresRefresh=True;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                if(message.removed)
                    signatureEle.value = "";
                else
                    signatureEle.value = message.signature;
            }

            if(message.name=="ProxyValidator")
            {
                if(message.removed)
                    validatorEle.value = "";
                else
                    validatorEle.value = message.validator;
            }
        }

        if((message.status=="reset" || (message.status=="changed" && !message.removed)) && 
            signature!=null && signature!="")
        {
            signature = verify(signature);
            var timeout_cu = false;
            var timeout_30 = false;
            if(signature != null)
            {
                var tokens = signature.split("-");
                var ip_address = tokens[0];
                var time_out = tokens[1];
                var current_timestamp = Date.now()/1000.0;
                var timeout_timestamp = Number(time_out);
                // window.alert(timeout_timestamp);
                if(current_timestamp > timeout_timestamp)
                {
                    timeout_cu = true;
                }
                else if(current_timestamp + 30 > timeout_timestamp)
                {
                    timeout_30 = true;
                }
            }

            if(timeout_30)
            {
                document.cookie = "RequiresRefresh=True";
            }
            if(timeout_cu || signature==null)
            {
                chrome.runtime.sendMessage({ domain: domain, type: "removeCookies" }, function(response) {
                });
            }
        }

    });
}

function verify(signature)
{
    var sig = "";
    var tokens = signature.split(".");
    for(var index in tokens)
    {
        var token = tokens[index];
        token = token.replace(/^a/g, "");
        token = token.replace(/a$/g, "");
        sig = sig+token;
    }
    sig = sig.replace(/--/g, "+");
    sig = sig.replace(/_/g, "/");
    sig = sig.replace(/-([a-z])/g, function(v) { return v[1].toUpperCase(); });

    try
    {
        sig = nacl.util.decodeBase64(sig);        
    }catch(err)
    {
        sig = sig + "=";
        try
        {
            sig = nacl.util.decodeBase64(sig);        
        }catch(err)
        {
            sig = sig + "=";
            try
            {
                sig = nacl.util.decodeBase64(sig);
            }catch(err)
            {
                sig = null;
            }
        }        
    }
    var pub_key_base = "6B1KXE5THbU9f7MrlCu9VfjROAmzsFvI727VL9WJVsM=";
    var pub_key = nacl.util.decodeBase64(pub_key_base);

    if(sig!=null)
    {
        var openedMsg = nacl.sign.open(sig, pub_key);
        sig = nacl.util.encodeUTF8(openedMsg);
    }
    return sig;
}

injectRedirectViaProxyCode();