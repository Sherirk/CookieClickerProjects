// ==UserScript==
// @name srkModManager
// @grant GM_getValue
// @grant GM_setValue
// @include *://orteil.dashnet.org/cookieclicker/
// @include *://orteil.dashnet.org/cookieclicker/beta/
// @run-at document-end
// ==/UserScript==

var modlessReload=document.createElement('div');
modlessReload.id='modlessReloadButton';
l('versionNumber').before(modlessReload);
modlessReload.addEventListener('mousedown',(event)=>{
    if (event.buttons==1) {
        PlaySound('snd/tick.mp3');
        Meta.modsPopup();
    } else if (event.buttons==2) {
        if (Game.modless) {
            MM.requset({req:'update mods', mods:Meta.mods});
            Game.toReload=true;
        } else {
            MM.request({req:'modless'});
            Game.toReload=true;
        }
    }
});
modlessReload.addEventListener('contextmenu', (event)=>event.preventDefault());

Meta={ready:0,
    init:function(){
        if (App){Game.Notify('Mod Manager not loaded','The steam version already has a great manager!',[32,17]);return false;};

        var menu = Game.UpdateMenu;
        eval("Game.UpdateMenu = " + menu.toString().slice(0,-1) + "\n" +
        "            if(Game.onMenu == 'prefs'){\n"+
        "                //The 'Settings' block in the 'Options' menu\n"+
        "                settingsBlock=l('menu').querySelectorAll('.block')[1]\n"+
        "                //Remove old CheckModData button\n"+
        "                settingsBlock.firstChild.lastChild.remove()\n"+
        "\n"+
        "                //New block reminiscing the steam version\n"+
        "                var modsBlock=document.createElement('div');\n"+
        "                //Except now it has an id! I'm also not good at naming things\n"+
        "                modsBlock.id='ModsBlock'\n"+
        "                modsBlock.classList.add('block');\n"+
        "                modsBlock.style.padding='0px';\n"+
        "                modsBlock.style.margin='8px 4px';\n"+
        "                str='<div class=\"subsection\" style=\"padding:0px;\"><div class=\"title\">'+loc(\"Mods\")+'</div>'+\n"+
        "                '<div style=\"text-align:center;\">'+\n"+
        "                '<a style=\"text-align:center;margin:4px;\" class=\"option smallFancyButton\" '+Game.clickStr+'=\"Meta.modsPopup();PlaySound(\\'snd/tick.mp3\\');\">'+loc(\"Manage mods\")+'</a>'+\n"+
        "                '<a style=\"text-align:center;margin:4px;\" class=\"option smallFancyButton\" '+Game.clickStr+'=\"Game.CheckModData();PlaySound(\\'snd/tick.mp3\\');\">'+loc(\"Check mod data\")+'</a>'+\n"+
        "                '</div>';\n"+
        "                modsBlock.innerHTML=str;\n"+
        "\n"+
        "                //We place our new block after the last block\n"+
        "                settingsBlock.after(modsBlock);\n"+
        "            }\n"+
        "        }");

        Game.saveModData=function()
        {
            var str='';
            for (var i=0;i<Game.sortedMods.length;i++)
            {
                if (Game.sortedMods[i]['save'])
                {
                    var data=Game.sortedMods[i]['save']();
                    if (typeof data!=='undefined') Game.modSaveData[Game.sortedMods[i].id]=data;
                }
            }
            for (var i in Game.modSaveData)
            {
                str+=i+':'+Game.safeSaveString(Game.modSaveData[i])+';';
            }
            if (Meta && Meta.saveMods) str+=Meta.saveMods();
            return str;
        }

        Meta.loadMods(Game.launchMods);
    },
    saveMods:function(){
        //save mod order
        if (Meta.modList.length==0) return false;
        str='META:';
        for (var i=0;i<Meta.modList.length;i++)
        {
            str+=(Meta.mods[i].disabled?'*':'')+Meta.mods[i].name+(i<Meta.mods.length-1?',':'');
        }
        str+=';';
        return str;
    },
    saveModlist:function(replace){
        let okay=true;
        if (Game.useLocalStorage)
        {
            var data=localStorageGet(Game.SaveTo);
            if (!data)
            {
                if (document.cookie.indexOf(Game.SaveTo)>=0)
                {
                    str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);
                    document.cookie=Game.SaveTo+'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                }
                else okay = false;
            }
            else
            {
                str=unescape(data);
            }
        }
        else//legacy system
        {
            if (document.cookie.indexOf(Game.SaveTo)>=0) str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);//get cookie here
            else okay = false;
        }
        var str=unescape(data);
        str=str.split('!END!')[0];
        str=b64_to_utf8(str);
        str=str.split('|');

        var spl=(str[9]||'').split(';');
        let index=spl.indexOf(spl.find(it=>it.indexOf('META:')==0));
        if (index >= 0) {
            spl[index]=replace||Meta.saveMods();
            spl.splice(index+1,1);
        } else {
            spl.push(replace||Meta.saveMods());
        }
        str[9]=spl.join(';');
        str=str.join('|');
        if (Game.useLocalStorage)
        {
            str=utf8_to_b64(str)+'!END!';
            if (str.length<10)
            {
                Game.Notify(loc("Error while saving your mods!"),"",0,1);
                okay = false;
            }
            else
            {
                str=escape(str);
                localStorageSet(Game.SaveTo,str);//aaand save
                if (!localStorageGet(Game.SaveTo))
                {
                    Game.Notify(loc("Error while saving your mods!"),"",0,1);
                    okay = false;
                }
                else if (document.hasFocus())
                {
                    Game.Notify(loc("Mod's order saved"),'','',1,1);
                }
            }
        }
        else//legacy system
        {
            var now=new Date();
            now.setFullYear(now.getFullYear()+5);
            str=utf8_to_b64(str)+'!END!';
            Game.saveData=escape(str);
            str=Game.SaveTo+'='+escape(str)+'; expires='+now.toUTCString()+';';
            document.cookie=str;//aaand save
            if (document.cookie.indexOf(Game.SaveTo)<0)
            {
                Game.Notify(loc("Error while saving your mods!"),"",0,1);
                okay = false;
            }
            else if (document.hasFocus())
            {
                Game.Notify(loc("Mod's order saved"),'','',1,1);
            }
        }
        return okay;
    },
    loadMods:function(callback){
        if (Game.useLocalStorage)
        {
            var data=localStorageGet(Game.SaveTo);
            if (!data)
            {
                if (document.cookie.indexOf(Game.SaveTo)>=0)
                {
                    str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);
                    document.cookie=Game.SaveTo+'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                }
                else return false;
            }
            else
            {
                str=unescape(data);
            }
        }
        else//legacy system
        {
            if (document.cookie.indexOf(Game.SaveTo)>=0) str=unescape(document.cookie.split(Game.SaveTo+'=')[1]);//get cookie here
            else return false;
        }
        var str=unescape(data);
        str=str.split('!END!')[0];
        str=b64_to_utf8(str);
        str=str.split('|');

        var spl=(str[9]||'').split(';');
        let modMeta=spl.find(it=>it.indexOf('META:')==0);
        if (modMeta && modMeta.split(':')[1].length>0) modMeta=modMeta.split(':')[1].split(','); else modMeta=[];
        Meta.modList = modMeta;

        if (!Meta.modList) Meta.modList=[];

        for (let i=0;i<Meta.modList.length;i++){
            let mod={};
            mod.name=Meta.modList[i];
            if (mod.name[0]=='*') mod.name=mod.name.slice(1);
            let found=false;
            for (let i=0;i<Meta.mods.length;i++){
                if (Meta.mods[i].name==mod.name) {found=true};
            }
            if (!found) {
                mod.disabled=true;
                MM.request({req:'add mod', mod:{name:mod.name, disabled:mod.disabled}});
                Game.brokenMods.push(mod.name);
            }
        }

        for (let i=0;i<Meta.mods.length;i++)
        {
            let mod=Meta.mods[i];
            if (mod.disabled) continue;
            if (!mod.url) Game.brokenMods.push(mod.name);
        }

        for (let i=0;i<Meta.mods.length;i++)
        {
            let mod=Meta.mods[i];
            if (Meta.modList.includes('*'+mod.name)) {mod.disabled=true;Meta.modList.splice(Meta.modList.indexOf('*'+mod.name),1,mod.name);}
            else if (Meta.modList.includes(mod.name)) {if (mod.url) {mod.disabled=false;}else{mod.disabled=true;};}
            else Meta.modList.push(mod.name);//new mods get pushed to the bottom
        }
        let promises=[];
        let loadedMods=[];
        for (let i=0;i<Meta.mods.length;i++)
        {
            let mod=Meta.mods[i];
            if (Game.modless) continue;
            if (mod.disabled) continue;
            if (mod.url)
            {
                promises.push(new Promise((resolve,reject)=>{
                    Game.LoadMod(mod.url,()=>{loadedMods.push(mod.name);resolve()},()=>{console.log("Failed to load mod url:",mod.url);Game.brokenMods.push(mod.name);reject()});
                }));
            };
        }
        Promise.allSettled(promises)
        .then(() => {
            console.log('loaded mods:', loadedMods.join(',')||'(none)');
            Meta.ready=1;
            if(callback) callback();
        });
    },
    modsPopup:function(){
        let selectedMod=0;

        let mods=[];
        for (var i=0;i<Meta.modList.length;i++)
        {
            for (let ii=0;ii<Meta.mods.length;ii++){
                if (Meta.mods[ii].name==Meta.modList[i]) {
                    let mod=Meta.mods[ii];
                    let obj={};
                    obj.name=mod.name;
                    obj.url=mod.url;
                    obj.i=i;
                    obj.disabled=mod.disabled;
                    mods.push(obj);
                }
            }
        }

        let checkModURL=(mod)=>{
            let okay=true;
            if (mod.url) mod.urlStr='<input type="url" id="urlInput" class="tightInput Meta" style="margin-top:4px;width:60%;height:auto;vertical-align:middle;" value="'+mod.url+'"></div>';
            else {mod.urlStr='<input type="url" id="urlInput" class="tightInput pucker Meta" style="margin-top:4px;width:60%;height:auto;vertical-align:middle;border-color:#c00"></div>';mod.disabled=true;okay=false;}
            return okay;
        }

        let changeMods=()=>{l('promptOption0').style.display='inline-block';l('promptOption1').style.display='inline-block';}
        let updateModList=()=>
        {
            let el=l('modList');if (!el) return false;

            let str='';

            for (let i=0;i<mods.length;i++)
            {
                let mod=mods[i];
                mod.i=i;
                checkModURL(mod);
                str+='<div class="zebra mouseOver'+(mod==selectedMod?' selected pucker':'')+'" style="padding:4px;'+(mod.disabled?'opacity:0.5;background:rgba(255,0,0,0.2);':'')+'" id="mod-'+i+'"><b id="mod-name-'+i+'"></b></div>';
            }
            el.innerHTML=str;
            for (let i=0;i<mods.length;i++)
            {
                let mod=mods[i];
                l('mod-name-'+i).textContent=mod.name;
                AddEvent(l('mod-'+i),'click',()=>{PlaySound('snd/tick.mp3');selectedMod=(selectedMod==mod?0:mod);updateModList();});
            }
            updateModOptions();
        }
        let updateModOptions=()=>
        {
            let el=l('modOptions');if (!el) return false;

            if (selectedMod)
            {
                let mod=selectedMod;
                checkModURL(mod);
                el.innerHTML=
                    '<div class="name"><input type="text" id="modName" class="Meta" style="width:auto;"></div>'+
                    '<div class="line"></div>'+
                    '<a class="option" id="modDisable" '+Game.clickStr+'="PlaySound("snd/tick.mp3");">'+(mod.disabled?loc("Enable"):loc("Disable"))+'</a>'+
                    '<a class="halfLeft option'+(mods.indexOf(mod)==0?' off':'')+'" id="modPUp" '+Game.clickStr+'="PlaySound("snd/tick.mp3");">'+loc("Priority up")+'</a>'+
                    '<a class="halfRight option'+(mods.indexOf(mod)==mods.length-1?' off':'')+'" id="modPDown" '+Game.clickStr+'="PlaySound("snd/tick.mp3");">'+loc("Priority down")+'</a>'+
                    '<a class="option warning" id="modRemove" '+Game.clickStr+'="Playsound("snd/tick.mp3");">'+loc("Remove")+'</a>'+
                    '<div style="margin:4px;"><span class="tag" style="margin-top:0px;vertical-align:middle;">'+loc("URL")+': </span>'+mod.urlStr+'</div>'+
                    '<div class="line"></div>'+
                    '<a class="option'+(Game.modless?' off':'')+'" id="modAdd" '+Game.clickStr+'="PlaySound("snd/tick.mp3");" style="width:auto">'+loc("Add mod")+'</a>';

                    AddEvent(l('modDisable'),'click',()=>{if (!mod.url){updateModOptions();return false;}changeMods();mod.disabled=!mod.disabled;updateModList();});
                    AddEvent(l('modPUp'),'click',()=>{if (mods.indexOf(mod)==0){return false;}changeMods();mods.splice(mods.indexOf(mod)-1,0,mods.splice(mods.indexOf(mod),1)[0]);updateModList();});
                    AddEvent(l('modPDown'),'click',()=>{if (mods.indexOf(mod)==mods.length-1){return false;}changeMods();mods.splice(mods.indexOf(mod)+1,0,mods.splice(mods.indexOf(mod),1)[0]);updateModList();});
                    AddEvent(l('modName'),'change',()=>{mod.name=l('modName').value;changeMods();updateModList();});
                    AddEvent(l('urlInput'),'change',()=>{mod.url=l('urlInput').value;changeMods();updateModList();});
                    AddEvent(l('modRemove'),'click',()=>{mods.splice(mods.indexOf(selectedMod),1);selectedMod=0;changeMods();updateModList();});
                    l('modName').value=mod.name;
            }
            else el.innerHTML=
                loc("Select a mod.")+'<div class="line"></div>'+'<a class="option'+(Game.modless?' off':'')+'" id="modAdd" '+Game.clickStr+'="PlaySound("snd/tick.mp3");" style="width:auto">'+loc("Add mod")+'</a>';

            AddEvent(l('modAdd'),'click',()=>{if(Game.modless){return false};Meta.newModPopup()});
        }
        Game.Prompt('<id ManageMods>'+
        '<h3>'+loc("Manage mods")+'</h3>'+
            '<div class="line"></div>'+
            '<div style="font-size:11px;opacity:0.7;">'+loc("Mods are loaded from top to bottom.")+'</div>'+
            (Game.modless?('<div style="font-size:11px;opacity:0.7;" class="warning">'+loc("Currently running the game in modless mode. You can use the manager to fix any issues but no mod will be loaded until a restart.")+'</div>'):'')+
            '<div class="line"></div>'+
            '<div style="height:300px;width:100%;position:relative;margin:12px 0px;">'+
                '<div class="inner" style="font-size:11px;height:100%;width:50%;overflow-x:hidden;overflow-y:scroll;position:absolute;left:0px;" id="modList"></div>'+
                '<div class="tight" style="font-size:11px;height:100%;width:50%;overflow-x:hidden;overflow-y:auto;position:absolute;right:0px;padding-left:10px;" id="modOptions"></div>'+
            '</div>'
        ,[[loc("Apply and restart"),0,'display:none;'],[loc("Apply, save and restart"),0,'display:none;'],loc("Cancel")],0,'widePrompt');
        updateModList();
        AddEvent(l('promptOption0'),'click',()=>{
            Meta.modList=mods.map(mod=>(mod.name));
            Meta.mods=mods.map(mod=>({name:mod.name, disabled:mod.disabled,url:mod.url}));
            MM.request({req:'update mods', mods:Meta.mods});
            if (!Meta.saveModlist()) return false;
            Game.toReload=true;
        });
        AddEvent(l('promptOption1'),'click',()=>{
            Meta.modList=mods.map(mod=>(mod.name));
            Meta.mods=mods.map(mod=>({name:mod.name, disabled:mod.disabled,url:mod.url}));
            MM.request({req:'update mods', mods:Meta.mods});
            Game.toSave=true;
            Game.toReload=true;
        });
    },
    newModPopup:function(){
        let checkValues=()=>
        {
            let okay=true;
            l('nameMod').classList='tightInput Meta';
            l('urlMod').classList='tightInput Meta';
            if (!l('nameMod').value){
                l('nameMod').classList.add('pucker');
                okay=false;
                setTimeout(()=>l('nameMod').classList.remove('pucker'),100);
            }
            if (!l('urlMod').value){
                l('urlMod').classList.add('pucker');
                okay=false;
                setTimeout(()=>l('urlMod').classList.remove('pucker'),100);
            }
            return okay;
        }
        Game.Prompt('<id NewMod>'+
        '<h3>'+loc("Add Mod")+'</h3>'+
            '<div class="line"></div>'+
            '<div style="width:100%;position:relative;margin:12px 0px;">'+
                '<div><label>Name: </label>'+'<input type="text" id="nameMod" placeholder="Name of your mod" style="width:auto;"></div>'+
                '<div><label>URL: </label>'+'<input type="url" id="urlMod" placeholder="URL of your mod" style="width:auto;"></div>'+
            '</div>'
        ,[[loc("Add"),"false"],[loc("Back"),'Meta.modsPopup()'],loc("Cancel")]);
        checkValues();
        AddEvent(l('promptOption0'),'click',()=>{
            if(!checkValues()) return false;
            MM.request({req:'add mod', mod:{name:l('nameMod').value, url:l('urlMod').value}});
            Game.LoadMod(l('urlMod').value);
            Game.ClosePrompt();
        });
    },
    request:function (data){
        if (data.req) {
            if (data.req=='update mods'){
                Meta.mods=data.mods;
                if (!Meta.modList) Meta.modList=[];
                for (let i=0;i<Meta.mods.length;i++)
                {
                    let mod=Meta.mods[i];
                    if (!Meta.modList.includes(mod.name)) Meta.modList.push(mod.name);
                }
            }
        }
    },
    delay:function(){
        if(Game && Game.ready){
            if(MM.modless)Game.modless=1;MM.modless=false;
            Meta.init();
        } else {
            requestAnimationFrame(Meta.delay);
        }
    }
};

MM = {};

MM.loadData = function(callback){
    var data=JSON.parse(GM_getValue('data', '{"modless":false, "mods":[]}'));
    MM.mods=data.mods;
    MM.modless=data.modless;
    if (MM.mods.length) console.log(MM.mods);
    callback();
}

MM.saveData = function(){
    GM_setValue('data', JSON.stringify({modless:MM.modless, mods:MM.mods}));
}

//This is the "App" listening to the game
MM.request = function(data){
    console.log(data);
    if (data.req) {
        if (data.req=='add mod') {
            MM.mods.push(data.mod);
            MM.saveData();
            Meta.request({req:'update mods', mods:MM.mods});

        } else if (data.req=='update mods') {
            MM.mods=data.mods;
            MM.saveData();

        } else if (data.req=='modless') {
	    MM.modless=true;
	    MM.saveData();
	}
    }
};

start=function(){
    Meta.mods=MM.mods;
    requestAnimationFrame(Meta.delay);
}

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
    "}\n"+
    "#modlessReloadButton\n"+
    "{\n"+
    "    position: absolute;\n"+
    "    left: calc(30% - 24px);\n"+
    "    bottom: 0px;\n"+
    "    height: 16px;\n"+
    "    width: 16px;\n"+
    "    margin: 8px;\n"+
    "    cursor: pointer;\n"+
    "    z-index: 6;\n"+
    "    background: -400px -560px/576px 592px url(img/icons.png)\n"+
    "}\n"+
    ".lumpsOn #modlessReloadButton\n"+
    "{\n"+
    "    bottom: 15px;\n"+
    "}";

var styleSheet = document.createElement('style');
styleSheet.innerText=styles;
document.head.appendChild(styleSheet);

MM.loadData(start);
