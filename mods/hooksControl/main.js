/*Somehow the hooks of my mod don't get added according to the list I set it to ingame. It may be because of connectivity problems with Steam, 
because my PC is slow and the mods are initializing without letting the other finish, or maybe it has to do with the way the Game itself does it all.
I just decided to create this mod and be done with it, but some weekend I may end up reading all of the Game code just to be satiate my curiosity.*/
Game.registerMod("srkHooksControl",{
	init: function() {
        let MOD=this;
        MOD.prefs=[];
        MOD.hooks={};
        MOD.first=true;
        
        //Replace updatemenu function to write the new buttons
        var menu = Game.UpdateMenu;
        Game.UpdateMenu = function(){
            menu();
            if(Game.onMenu == 'prefs'){
                //New buttons
                var modHookButton = document.createElement("div");
                modHookButton.classList.add("listing");
                modHookButton.innerHTML = '<div class="title">Hooks<title>'
                modHookButton.innerHTML += '<a class="option smallFancyButton" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.mods[\'srkHooksControl\'].getHooksPopup();";>'+loc("Manage")+'</a><br>';
                //Place buttons
				var allSections = document.querySelectorAll('#menu > div.block > div.subsection')
				var modsSection = allSections.length>2?document.querySelectorAll('#menu > div.block > div.subsection')[2]:document.querySelectorAll('#menu > div.block > div.subsection')[1];
				modsSection.append(modHookButton);
            }
        }

        //Modified to push the functions to our array as well as the Game's
        Game.registerHook=function(hook,func)
        {
            if (func.constructor===Array)
            {
                for (var i=0;i<func.length;i++){Game.registerHook(hook,func[i]);}
                return;
            }
            if (typeof func!=='function') return;
            if (typeof Game.modHooks[hook]!=='undefined') {
                Game.modHooks[hook].push(func);
                if (typeof Game.mods['srkHooksControl'].hooks[hook]==='undefined') Game.mods['srkHooksControl'].hooks[hook]=[];//This should never happen, but if we don't know this hook then add it.
                //The game doesn't check whether or not the function is already registered (probably because of unnamed functions or two mods naming them the same without knowing), so we don't either.
                Game.mods['srkHooksControl'].hooks[hook].push({name:func.name,i:Game.mods['srkHooksControl'].hooks[hook].length,disabled:false,function:func});
            } else console.log('Error: a mod tried to register a non-existent hook named "'+hook+'".');
        }
        //Modified to disable our function from our array
        Game.removeHook=function(hook,func)
        {
            if (func.constructor===Array)
            {
                for (var i=0;i<func.length;i++){Game.removeHook(hook,func[i]);}
                return;
            }
            if (typeof func!=='function') return;
            if (typeof Game.modHooks[hook]!=='undefined' && Game.modHooks[hook].indexOf(func)!=-1) {
                //Can't use indexOf because our array is an array of objecs, so I copied and modified indexOf in here
                Game.modHooks[hook].splice(Game.modHooks[hook].indexOf(func),1);{()=>{
                    for (var i=0;i<MOD.hooks[hook].length;i++) {
                        if(Game.mods['srkHooksControl'].hooks[hook][i].func === func) {Game.mods['srkHooksControl'].hooks[hook][i].disabled=true;return;}
                    }
                }};
            } else console.log('Error: a mod tried to remove a non-existent hook named "'+hook+'".');
        }
		Game.Notify('You can now control your mods!', 'Unlimited powaaaa!', [32,0],10,1);
	},

    //For the list of hooks registered. As of 2.052 Orteil has made 10 hooks available
    getHooksPopup: function() {

        //To create the buttons with the names of the hooks, and whether or not they will call a new prompt (not if they are empty)
        let updateHooksDisplay=()=>
        {
            let str='';
            str+=`
            <div style="font-size:11px;">
                ${tinyIcon([16,5])}<div></div>
                ${loc("you can use this tool to reorder, disable and reenable the different functions that your loaded mods have made hooked to the game")}
            </div>
            <div class="line"></div>
            <div style="overflow:hidden;clear:both;">`
            //Buttons themselves
            for (var i=0;i<Game.modHooksNames.length;i++){
                str+='<a class="option" id="'+Game.modHooksNames[i]+'HookDisplay" style="display:block;font-weight:bold;" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');">'+loc(cap(Game.modHooksNames[i]))+'</a>';
                str+='</div>';
            }
            str+=`</div>`;
            l('hooksDisplay').innerHTML=str;
            //AddEvent to each button, with our empty hooks being only a tick sound
            for (let i=0;i<Game.modHooksNames.length;i++)
            {
                AddEvent(l(Game.modHooksNames[i]+'HookDisplay'),'click',()=>{if (!Game.mods['srkHooksControl'].hooks[Game.modHooksNames[i]].length){return false;}Game.mods["srkHooksControl"].getFunctionsPopup(Game.modHooksNames[i]);});
                //If it is our first time opening the promt, delete all from our hook's array and populate with current functions (so that it doesn't matter the order of initialization of this mod)
                if (Game.mods['srkHooksControl'].first) Game.mods['srkHooksControl'].hooks[Game.modHooksNames[i]]=Game.modHooks[Game.modHooksNames[i]].map((value,index)=>({name:value.name,i:index,disabled:false,function:value}));
            }
            if (Game.mods['srkHooksControl'].first) Game.mods['srkHooksControl'].first=false;
            Game.UpdatePrompt();
        }

        //Thank you for creating this function Orteil. Now that I flattered you, could you add some more hooks as well? I want to be able to tear the game apart with consent.
        Game.Prompt(`<id ManageHooks>
		<h3>${loc("Manage Hooks")}</h3>
		<div class="line"></div>
		<div class="block" id="hooksDisplay"></div>
	    `,[loc("Cancel")]);
	    updateHooksDisplay();
    },

    //List of functions in a hook
    getFunctionsPopup: function(hookName) {
        let selectedFunc=0;
	
        //Temporary array of functions to modify
        let funcs=[];
        if (Game.mods['srkHooksControl'].hooks[hookName].length>0) {
            funcs=Game.mods['srkHooksControl'].hooks[hookName]
        } else {
            for (var i=0;i<Game.modHooks[hookName].length;i++)
            {
                let funcs=Game.modHooks[hookName][i];
                let obj={};
                obj.name=func.name;
                obj.i=i;
                obj.disabled=false;
                obj.function=func;
                funcs.push(obj);
            }
        }

        //We modified the list so make the apply changes button appear
        let changeFunctions=()=>{l('promptOption0').style.display='inline-block';}
        //The list to be added to the prompt
        let updateFunctionsList=()=>
        {
            let el=l('functionList');if (!el) return false;
            
            let str='';
            
            for (let i=0;i<funcs.length;i++)
            {
                let func=funcs[i];
                func.i=i;
                str+=`<div class="zebra mouseOver${func==selectedFunc?' selected pucker':''}" style="padding:4px;${func.disabled?'opacity:0.5;background:rgba(255,0,0,0.2);':''}" id="func-${i}"><b id="func-name-${i}"></b></div>`;
            }
            el.innerHTML=str;
            for (let i=0;i<funcs.length;i++)
            {
                let func=funcs[i];
                l('func-name-'+i).textContent=func.name||'(untitled function)';
                AddEvent(l('func-'+i),'click',()=>{PlaySound('snd/tick.mp3');selectedFunc=(selectedFunc==func?0:func);updateFunctionsList();});
            }
            updateFunctionDisplay();
        }
        //The right hand side display with the function itself and the buttons
        let updateFunctionDisplay=()=>
        {
            let el=l('functionDisplay');if (!el) return false;
            
            if (selectedFunc)
            {
                let func=selectedFunc;
                el.innerHTML=`
                    <div class="name" id="funcName"></div>
                    <div class="line"></div>
                    <a class="option" id="funcDisable" ${Game.clickStr}="PlaySound('snd/tick.mp3');">${func.disabled?loc("Enable"):loc("Disable")}</a>
                    <a class="halfLeft option${funcs.indexOf(func)==0?' off':''}" id="funcPUp" ${Game.clickStr}="PlaySound('snd/tick.mp3');">${loc("Priority up")}</a>
                    <a class="halfRight option${funcs.indexOf(func)==funcs.length-1?' off':''}" id="funcPDown" ${Game.clickStr}="PlaySound('snd/tick.mp3');">${loc("Priority down")}</a>
                    ${func.function?'<textarea readonly id="funcFunction" style="margin:4px;padding:4px 8px;width:80%;height:200px;box-sizing:border-box;font-size:11px;"></textarea>':''}
                `;
                AddEvent(l('funcDisable'),'click',()=>{changeFunctions();func.disabled=!func.disabled;updateFunctionsList();});
                AddEvent(l('funcPUp'),'click',()=>{if (funcs.indexOf(func)==0){return false;}changeFunctions();funcs.splice(funcs.indexOf(func)-1,0,funcs.splice(funcs.indexOf(func),1)[0]);updateFunctionsList();});
                AddEvent(l('funcPDown'),'click',()=>{if (funcs.indexOf(func)==funcs.length-1){return false;}changeFunctions();funcs.splice(funcs.indexOf(func)+1,0,funcs.splice(funcs.indexOf(func),1)[0]);updateFunctionsList();});
                l('funcName').textContent=func.name||'(untitled function)';
                if(func.function) l('funcFunction').textContent=func.function.toString();
            }
            else el.innerHTML=loc("Select a function.");
        }

        Game.Prompt(`<id ManageFunctions>
            <h3>${loc("Manage "+hookName+" functions")}</h3>
            <div class="line"></div>
            <div style="font-size:11px;opacity:0.7;">${loc("Functions are loaded from top to bottom.")}</div>
            <div class="line"></div>
            <div style="height:300px;width:100%;position:relative;margin:12px 0px;">
                <div class="inner" style="font-size:11px;height:100%;width:50%;overflow-x:hidden;overflow-y:scroll;position:absolute;left:0px;" id="functionList"></div>
                <div class="tight" style="font-size:11px;height:100%;width:50%;overflow-x:hidden;overflow-y:hidden;position:absolute;right:0px;padding-left:10px;" id="functionDisplay"></div>
            </div>
        `,[[loc("Apply changes"),0,'display:none;'],[loc("Back"),'Game.mods["srkHooksControl"].getHooksPopup();']],0,'widePrompt');
        updateFunctionsList();
        AddEvent(l('promptOption0'),'click',()=>{
            //When applying changes, set our temp array to our main array
            Game.mods['srkHooksControl'].hooks[hookName]=funcs;
            //For each function, if they are enabled then push them to the Game's array
            Game.modHooks[hookName]=funcs.filter(func=>(!func.disabled)).map(func=>(func.function));
        });
    },
});
