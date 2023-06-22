Game.registerMod("srkFPSGraph",{
	init: function() {
		let MOD=this;
		MOD.fps=Game.fps;
		MOD.prefs=[];

		//Replace updatemenu function to write the new buttons
        var menu = Game.UpdateMenu;
        Game.UpdateMenu = function(){
            menu();
            if(Game.onMenu == 'prefs'){
                //New buttons
				var FPSButtons = document.createElement("div");
				FPSButtons.classList.add("listing");
				FPSButtons.innerHTML = "<div class='title'>FPS</div>";
                FPSButtons.innerHTML += MOD.WritePrefButton('enabled','fpsButton',loc("FPS Graph")+ON,loc("FPS Graph")+OFF)+'<br>';
                FPSButtons.innerHTML += MOD.WritePrefButton('timers','timerButton',loc("Debug Timers")+ON,loc("Debug Timers")+OFF)+'<label>('+loc("to check what is lagging the game")+')</label><br>';
				FPSButtons.innerHTML += MOD.WritePrefButton('extraInfo','extraInfoButton',loc("Extra Info")+ON,loc("Extra Info")+OFF)+'<label>('+loc("get extra info about upgrades and achievements")+')</label><br>';
				FPSButtons.innerHTML += '<a class="option smallFancyButton" '+Game.clickStr+'="Game.DebugUpgradeCpS();Timer.log(\'debugUpgrades\');PlaySound(\'snd/tick.mp3\');">'+loc("Debug Upgrades")+'</a>'+'<a class="option smallFancyButton" '+Game.clickStr+'="Game.debuggedUpgradeCpS=[];Game.debuggedUpgradeCpClick=[];PlaySound(\'snd/tick.mp3\');">'+loc("Clean")+'</a><label>('+loc('to calculate the boost to CpS and CpClick of each upgrade')+')</label><br>';
				//Place buttons
				var allSections = document.querySelectorAll('#menu > div.block > div.subsection')
				var modsSection = allSections.length>2?document.querySelectorAll('#menu > div.block > div.subsection')[2]:document.querySelectorAll('#menu > div.block > div.subsection')[1];
				modsSection.append(FPSButtons);
            }
        }

        var str='<div id="CounterDiv" class="framed" style="position:relative;left:-2px;top:-2px;width:24px;height:32px;cursor:pointer;text-align:center;">'
		str+='<div class="icon" style="position:absolute;left:-9px;top:-6px;background-position:'+(-10*48)+'px '+(-6*48)+'px;" onClick="Game.Popup(\'<small>\'+choose([\'nope\', \'unavailable\',\'no cheating today\',\'you need another mod for that\'])+\'</small>\',Game.mouseX,Game.mouseY)"></div>';
		str+='<div style="position:absolute;left:0px;top:0px;z-index:10;font-size:10px;background:#000;padding:1px;cursor:pointer;" id="Counter"></div>';
        str+='</div>';
        
		l('debug').insertAdjacentHTML('afterend','<div id="FPSdiv" style="position:absolute;left:0px;top:0px;z-index:1000000000;"></div>');

        l('FPSdiv').innerHTML=str;

		l('FPSdiv').appendChild(l('debugLog'));
		// Game.debugTimersOn = 1;

        //We use the same id as the debug fps graph so as to not double display it (should not be possible but eh).
		if (!l('fpsGraph'))
		{
			var div=document.createElement('canvas');
			div.id='fpsGraph';
            //Slightly thinner than web version because somehow steam version seems zoomed in? (maybe it's a proton+electron thing)
			////Actually, get rid of that idea. Everything is in the way of everything anyways.
			div.width=120;
			div.height=64;
			div.style.opacity=0.5;
			div.style.pointerEvents='none';
			div.style.transformOrigin='0% 0%';
			div.style.transform='scale(0.75)';
			l('CounterDiv').parentNode.insertBefore(div,l('CounterDiv').nextSibling);
			this.fpsGraph=div;
			this.fpsGraphCtx=this.fpsGraph.getContext('2d',{alpha:false});
			var ctx=this.fpsGraphCtx;
			ctx.fillStyle='#000';
			ctx.fillRect(0,0,120,64);
		}
		
		//// Can't get Timers to work at all, maybe later////
		//////Timer.reset was called every logic tick before the modhook, which obviously made the Timer.labels empty.
		//////Timer.reset will be used as our logic hook, by calling drawfps before resetting the labels.
		Timer.reset=function()
		{
			drawFPS();
			Timer.labels=[];
			Timer.t=Date.now();
		}
		//We redefine timer functions so that Game.sesame is not a condition.
		Timer.track=function(label)
		{
			var now=Date.now();
			if (!Timer.smoothed[label]) Timer.smoothed[label]=0;
			Timer.smoothed[label]+=((now-Timer.t)-Timer.smoothed[label])*0.1;
			Timer.labels[label]='<div style="padding-left:8px;">'+label+' : '+Math.round(Timer.smoothed[label])+'ms</div>';
			Timer.t=now;
		}
		Timer.clean=function()
		{
			var now=Date.now();
			Timer.t=now;
		}
		Timer.say=function(label)
		{
			Timer.labels[label]='<div style="border-top:1px solid #ccc;">'+label+'</div>';
		}
		Timer.log=function(label)
		{
			var now=Date.now();
			if (!Timer.unsmoothed[label]) Timer.unsmoothed[label]=0;
			Timer.unsmoothed[label]=((now-Timer.t));
			console.log(label+' : '+Math.round(Timer.unsmoothed[label])+'ms');
			Timer.t=now;
		}

		//added an unsmoothed list. For use with log
		Timer.unsmoothed=[]

        //Pretty much the same from main.js
		drawFPS = function(){
			if (MOD.prefs.enabled) {
				l('FPSdiv').style.display='block';
				MOD.previousFps=MOD.currentFps;
				MOD.currentFps=Game.getFps();
					var ctx=MOD.fpsGraphCtx;
					ctx.drawImage(MOD.fpsGraph,-1,0);
					ctx.fillStyle='rgb('+Math.round((1-MOD.currentFps/MOD.fps)*120)+',0,0)';
					ctx.fillRect(120-1,0,1,64);
					ctx.strokeStyle='#fff';
					ctx.beginPath();
					ctx.moveTo(120-1,(1-MOD.previousFps/MOD.fps)*64);
					ctx.lineTo(120,(1-MOD.currentFps/MOD.fps)*64);
					ctx.stroke();

				l('Counter').textContent=MOD.currentFps+' fps';

				var str='';
				for (var i in Timer.labels) {str+=Timer.labels[i];}
				if (MOD.prefs.timers) l('debugLog').style.display='block';
				else l('debugLog').style.display='none';
				l('debugLog').innerHTML=str;
			} else {
				l('FPSdiv').style.display='none';
			}
		}

		//Game.registerHook('logic',)

        Game.Notify('FPS Graph has been enabled.', '', [10,6],10,1);


		//Changing two (2) whole lines in crate and cratetooltip so that we can get extrainfo in upgrades
		var ogCrate = Game.crate;
		Game.crate=function(me,context,forceClickStr,id,style)
		{
			var mysterious=(me.won<=0)?1:0;
			var icon=mysterious?[0,7]:me.icon;
			ogCrateStr=ogCrate(me,context,forceClickStr,id,style);
			
			noText='style="'+(mysterious?
				'background-position:'+(-0*48)+'px '+(-7*48)+'px;':
				writeIcon(icon))+
				((context=='ascend' && me.pool=='prestige')?'position:absolute;left:'+me.posX+'px;top:'+me.posY+'px;':'')+
				(style||'')+
			'">'+
			(Game.prefs.screenreader?'<label class="srOnly" id="ariaReader-'+me.type+'-'+me.id+'"></label>':'')+
			(me.choicesFunction?'<div class="selectorCorner"></div>':'')+
			(Game.prefs.screenreader?'</button>':'</div>');
			if (ogCrateStr.indexOf(noText)!=-1)
			{
				var text=[];
				if (MOD.prefs.extraInfo)
				{
					if (Game.debuggedUpgradeCpS[me.name] || Game.debuggedUpgradeCpClick[me.name])
					{
						text.push('x'+Beautify(1+Game.debuggedUpgradeCpS[me.name],2));text.push(Game.debugColors[Math.floor(Math.max(0,Math.min(Game.debugColors.length-1,Math.pow(Game.debuggedUpgradeCpS[me.name]/2,0.5)*Game.debugColors.length)))]);
						text.push('x'+Beautify(1+Game.debuggedUpgradeCpClick[me.name],2));text.push(Game.debugColors[Math.floor(Math.max(0,Math.min(Game.debugColors.length-1,Math.pow(Game.debuggedUpgradeCpClick[me.name]/2,0.5)*Game.debugColors.length)))]);
					}
					if (Game.extraInfo) {text.push(Math.floor(me.order)+(me.power?'<br>P:'+me.power:''));text.push('#fff');}
				}
				var textStr='';
				for (var i=0;i<text.length;i+=2)
				{
					textStr+='<div style="opacity:0.9;z-index:1000;padding:0px 2px;background:'+text[i+1]+';color:#000;font-size:10px;position:absolute;top:'+(i/2*10)+'px;left:0px;">'+text[i]+'</div>';
				}
				return (ogCrateStr.slice(0,ogCrateStr.indexOf(noText)))+'style="'+(mysterious?
					'background-position:'+(-0*48)+'px '+(-7*48)+'px;':
					writeIcon(icon))+
					((context=='ascend' && me.pool=='prestige')?'position:absolute;left:'+me.posX+'px;top:'+me.posY+'px;':'')+
					(style||'')+
				'">'+
				textStr+
				(Game.prefs.screenreader?'<label class="srOnly" id="ariaReader-'+me.type+'-'+me.id+'"></label>':'')+
				(me.choicesFunction?'<div class="selectorCorner"></div>':'')+
				(Game.prefs.screenreader?'</button>':'</div>');
			} else {
				return ogCrateStr;
			}
		}
		var tooltip = Game.crateTooltip;
		Game.crateTooltip=function(me,context)
		{
			var text=[];
			if (MOD.prefs.extraInfo)
			{
				if (Game.debuggedUpgradeCpS[me.name] || Game.debuggedUpgradeCpClick[me.name])
				{
					text.push('x'+Beautify(1+Game.debuggedUpgradeCpS[me.name],2));
					text.push('x'+Beautify(1+Game.debuggedUpgradeCpClick[me.name],2));
				}
				if (Game.extraInfo) {text.push(Math.floor(me.order)+(me.power?'<br>P:'+me.power:''));text.push('#fff');}
			}
			return (tooltip(me,context))+
			(MOD.prefs.extraInfo?('<div style="font-size:9px;">Id: '+me.id+' | Order: '+(me.order)+(me.tier?' | Tier: '+me.tier:'')+' | Icon: ['+me.icon[0]+','+me.icon[1]+']'+(text[0]?' | CpS: '+text[0]:'')+(text[1]?' | CpClick: '+text[1]:'')+'</div>'):'');
		}

	},

    save:function(){
		return String(this.prefs.enabled*1+this.prefs.timers*2+this.prefs.extraInfo*4);
	},

	load:function(str){
        str=parseInt(str);
        if(str&1) {this.prefs.enabled=1;} else {this.prefs.enabled=0;};
		if(str&2) {this.prefs.timers=1;} else {this.prefs.timers=0;};
		if(str&4) {this.prefs.extraInfo=1;} else {this.prefs.extraInfo=0;};
	},

    //Copied from main.js and modified so that the prefs get added to MOD and not Game
    WritePrefButton:function(prefName,button,on,off,callback,invert){
        var invert=invert?1:0;
        if (!callback) callback='';
        callback+='PlaySound(\'snd/tick.mp3\');';
        return '<a class="smallFancyButton prefButton option'+((Game.mods['srkFPSGraph'].prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="Game.mods[\'srkFPSGraph\'].Toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(Game.mods['srkFPSGraph'].prefs[prefName]?on:off)+'</a>';
    },

    Toggle:function(prefName,button,on,off,invert){
        if (Game.mods['srkFPSGraph'].prefs[prefName])
        {
            l(button).innerHTML=off;
            Game.mods['srkFPSGraph'].prefs[prefName]=0;
        }
        else
        {
            l(button).innerHTML=on;
            Game.mods['srkFPSGraph'].prefs[prefName]=1;
        }
        l(button).className='smallFancyButton prefButton option'+((Game.mods['srkFPSGraph'].prefs[prefName]^invert)?'':' off');  
    },
});