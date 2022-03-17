function remove(id) {
    var elem = document.getElementById(id);
    if (elem != null)
        return elem.parentNode.removeChild(elem);
}

function injectResetterCode(){
    console.log("Resetting XHR");

    var script_id = 'ctm_proxy_demo';
    remove(script_id);

    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", chrome.extension.getURL ("js/script-xhr-reset.js"), false );
    xmlHttp.send( null );
    remove(script_id);

    var inject  = document.createElement("script");
    inject.setAttribute("id", script_id);

    var code = xmlHttp.responseText
    inject.innerHTML = code;
    document.body.appendChild (inject, document.body.firstChild);
}

injectResetterCode();