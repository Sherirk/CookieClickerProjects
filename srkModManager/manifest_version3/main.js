navigator.browserInfo = (() => {
    const { userAgent } = navigator;
    let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    let temp;

    if (/trident/i.test(match[1])) {
        temp = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
        return { 'name':"IE ", 'version':(temp[1] || '') };
    }

    if (match[1] === 'Chrome') {
        temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
        if (temp !== null) {
            return { 'name':'Opera', 'version':temp[2] };
        }

        temp = userAgent.match(/\b(Edg)\/(\d+)/);
        if (temp !== null) {
            return { 'name':'Edge (Chromium)', 'version':temp[2] };
        }
    }

    match = match[2] ? [ match[1], match[2] ] : [ navigator.appName, navigator.appVersion, '-?' ];

    temp = userAgent.match(/version\/(\d+)/i);
    if (temp !== null) {
            match.splice(1, 1, temp[1]);
    }

    return { 'name': match[0], 'version': match[1] };
})()

MM = {};

MM.language=navigator.browserInfo.name.toLowerCase();
if (MM.language == 'chrome' || MM.language.includes('chromium')) browser=chrome;

MM.loadData = function(callback){
    function onError(error){
        console.log("Error: "+error);
    }

    function onGot(item){
        console.log('storage', item);
        if(item.mods){
            MM.mods = item.mods;
        }else{
            MM.mods = [];
        }
        callback();
    }
    browser.storage.local.get('mods').then(onGot, onError);
}

MM.saveData = function(){
    browser.storage.local.set({
        mods: MM.mods
    });
}

//THIS IS THE EXTENSION LISTENING TO THE GAME
window.addEventListener("message", (event) => {
    if (event.source !== window) {
        return;
    }
    if (event.data.sender=='Meta') {
        MM.request(event.data.data);
    }
});

MM.request = function(data) {
    if (data.req) {
         if (data.req=='add mod') {
            //Can't add info.txt support because of security issues
            //if (data.steam) {
                // MM.request({req:'parse info', mods:[data.mod]}, (mods) => {
                //     for (let i=0;i<mods.length;i++) {
                //         MM.mods.push(mods.mod);
                //     }
                //     MM.saveData();
                //     MM.send({req:'update mods', mods:MM.mods});
                // })
            MM.mods.push(data.mod);
            MM.saveData();
            MM.send({req:'update mods', mods:MM.mods});

        } else if (data.req=='update mods') {
            MM.mods=data.mods;
            MM.saveData();

        } else if (data.req=='get mods') {
            MM.send({req:'update mods', mods:MM.mods, callback:data.callback});
        }
    }
};

MM.send=function(data){
    window.postMessage({sender:'MM', data:data}, window);
}

injection=function(){
    var styles = "input.Meta:focus{outline:none;}\n"+
        "input.Meta\n"+
        "{\n"+
        "    background:#000 url(img/darkNoise.jpg);\n"+
        "    background-image:/url(img/shadedBordersSoft.png),url(img/darkNoise.jpg);\n"+
        "    background-size:100% 100%,auto;\n"+
        "    background-color:#000;\n"+
        "    text-shadow:0px 1px 1px #000;\n"+
        "    color:#ccc;\n"+
        "    border:1px solid #e2dd48;\n"+
        "    border-color:#ece2b6 #875526 #733726 #dfbc9a;\n"+
        "    border-radius:4px;\n"+
        "	 box-shadow:0px 0px 0px 1px rgba(0,0,0,0.5) inset,0px 1px 2px rgba(0,0,0,0.5) inset;\n"+
        "    text-align:center;\n"+
        "}";

    var styleSheet = document.createElement('style');
    styleSheet.innerText=styles;
    document.head.appendChild(styleSheet);

    var Meta=document.createElement('script');
    Meta.setAttribute('src', browser.runtime.getURL('meta.js'));
    document.head.appendChild(Meta);
}

MM.loadData(injection);
