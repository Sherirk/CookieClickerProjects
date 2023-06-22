//Some upgrades/achievs have hardcoded numbers, which makes me wanna comit arson. Also, the spanish loc file sometimes uses long scale and othertimes short scale.
//I found a way to "unhardcode" said numbers. It involves code parsers and that was enough for me to give up.
Game.registerMod("srkNumberFormatting",{
	init: function() {
		let MOD=this;
		MOD.prefs=[];

		//Replace updatemenu function to write the new buttons
		var menu = Game.UpdateMenu;
		Game.UpdateMenu = function(){
			menu();
			if(Game.onMenu == 'prefs'){
				//Remove old format button + label + break (maybe search for a way to identify them for certain)
                var formatButton = document.getElementById("formatButton");
                formatButton.nextSibling.nextSibling.remove();
                formatButton.nextSibling.remove();
                formatButton.remove();

				//New buttons
				var scaleButtons = document.createElement("div");
				scaleButtons.classList.add("listing");
				scaleButtons.innerHTML = "<div class='title'>Number formatting</div>";
				scaleButtons.innerHTML += MOD.WritePrefButton('long','longScaleButton',loc("Long Scale")+ON,loc("Long Scale")+OFF,'LocalizeUpgradesAndAchievs();Game.RefreshStore();Game.upgradesToRebuild=1;')+'<label>('+loc("european style")+')</label><br>';
				scaleButtons.innerHTML += MOD.WritePrefButton('short','shortFormatButton',loc("Short Notation")+ON,loc("Short Notation")+OFF,'LocalizeUpgradesAndAchievs();Game.RefreshStore();Game.upgradesToRebuild=1;')+'<label>('+loc("shorten the notation next to numbers")+')</label><br>';
				scaleButtons.innerHTML += MOD.WritePrefButton('comma','commaButton',loc("Decimal Comma")+ON,loc("Decimal Comma")+OFF,'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;')+'<label>('+loc("use commas for decimals and dots for thousands")+')</label><br>';
				//Old format button here for convenience
				scaleButtons.innerHTML += Game.WritePrefButton('format','formatButton',loc("Short numbers")+OFF,loc("Short numbers")+ON,'LocalizeUpgradesAndAchievs();Game.RefreshStore();Game.upgradesToRebuild=1;',1)+(EN?'<label>(shorten big numbers)</label>':'')+'<br>';
				//Place buttons
				var allSections = document.querySelectorAll('#menu > div.block > div.subsection')
				var modsSection = allSections.length>2?document.querySelectorAll('#menu > div.block > div.subsection')[2]:document.querySelectorAll('#menu > div.block > div.subsection')[1];
				modsSection.append(scaleButtons);
			}
		}

		formatEverySixthPower = function(notations){
			return function (val)
			{
				var base=1,notationValue='';
				if (!isFinite(val)) return 'Infinity';
				if (val>=1000000)
				{
					val/=1000000;
					while(Math.round(val)>=1000000)
					{
						val/=1000000;
						base++;
					}
					if (base>=notations.length) {return 'Infinity';} else {notationValue=notations[base];};
				}
				if (val>=1000) {return Math.round(val)+notationValue;} else {return (Math.round(val*1000)/1000)+notationValue;};
			};
		}
		
		numberFormatters=
		[
			formatEveryThirdPower(formatLong),
			formatEverySixthPower(formatLong),
			formatEveryThirdPower(formatShort),
			formatEverySixthPower(formatShort),
			rawFormatter
		];
		
		Beautify=function(val,floats)
		{
			var negative=(val<0);
			var decimal='';
			var fixed=val.toFixed(floats);
			if (floats>0 && Math.abs(val)<1000 && Math.floor(fixed)!=fixed) decimal=MOD.prefs.comma?','+(fixed.toString()).split('.')[1]:'.'+(fixed.toString()).split('.')[1];
			val=Math.floor(Math.abs(val));
			if (floats>0 && fixed==val+1) val++;
			//var format=!EN?2:Game.prefs.format?2:1;
			var format=Game.prefs.format?4:0;
			var longScale=format?0:MOD.prefs.long?1:0;
			var shortFormat=format?0:MOD.prefs.short?2:0;
			var formatter=numberFormatters[format+longScale+shortFormat];
			var output=(val.toString().indexOf('e+')!=-1 && format==4)?val.toPrecision(3).toString():formatter(val).toString()
			if (MOD.prefs.comma) output=output.replace('.',',');
			output = output.replace(/\B(?=(\d{3})+(?!\d))/g,MOD.prefs.comma?'.':',');
			//var output=formatter(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
			if (output=='0') negative=false;
			return negative?'-'+output:output+decimal;
		}

		SimpleBeautify=function(val)
		{
			var str=val.toString();
			var str2='';
			for (var i in str)//add commas(or dots)
			{
				if ((str.length-i)%3==0 && i>0) str2+=MOD.prefs.comma?'.':',';
				str2+=str[i];
			}
			return str2;
		}

		//Changed so that the game checks current and wanted decimal separator before beautifying
		var beautifall = BeautifyAll;
		BeautifyAll=function() {
			MOD.CheckTheCommas();
			beautifall();
		}

		//Get all upgrades and achieves to default desc, by forcing the use of decimal dot and using og beautify
		//This is needed whenever we change the beautify format, for decimal separators only we can do with BeautifyAll
		LocalizeUpgradesAndAchievs=function() {
			if (!Game.UpgradesById) return false;
			var tmpComma=MOD.prefs.comma;
			MOD.prefs.comma=0;
			beautifyInTextFilter=/(([\d]+[,]*)+)/g;//new regex
			BeautifyInTextFunction=function(str){return Beautify(parseInt(str.replace(/,/g,''),10));};
			BeautifyInText=function(str) {return str.replace(beautifyInTextFilter,BeautifyInTextFunction);}//reformat every number inside a string

			var allThings=[];
			for (var i in Game.UpgradesById){allThings.push(Game.UpgradesById[i]);}
			for (var i in Game.AchievementsById){allThings.push(Game.AchievementsById[i]);}
			for (var i=0;i<allThings.length;i++)
			{
				var it=allThings[i];
				var type=it.getType();
				var found=0;
				found=FindLocStringByPart(type+' name '+it.id);
				if (found) it.dname=loc(found);
				
				if (!EN) it.baseDesc=it.baseDesc.replace(/<q>.*/,'');//strip quote section
				//This line meant 3 hours of my life, which objectively means I'm bad at programming but I'm willing to ignore that and rage
				//In that context, Orteil, why are you beautifyng the text of the ddesc here? you do the same thing 10 lines later
				it.ddesc=BeautifyInText(it.baseDesc);
				
				found=FindLocStringByPart(type+' desc '+it.id);
				if (found) it.ddesc=loc(found);
				found=FindLocStringByPart(type+' quote '+it.id);
				if (found) it.ddesc+='<q>'+loc(found)+'</q>';
			}
			//Restore user preference
			MOD.prefs.comma=tmpComma;
			//Just don't do this twice (I could change that in this mod but nah)
			BeautifyAll();
		}

		drawCookieAmount = function(){
			if (!Game.OnAscend){	
				
				var str=Beautify(Math.round(Game.cookiesd));
				if (Game.cookiesd>=1000000)//dirty padding //Yes, yes it is
				{
					var decPos=MOD.prefs.comma?str.indexOf(','):str.indexOf('.');
					var decAmount=(decPos!=-1)?str.match(MOD.prefs.comma?/(?<=,)\d*/:/(?<=\.)\d*/)[0].length:0;
					var nrmAmount=str.match(MOD.prefs.comma?/(([\d]+[.]*)+)/:/(([\d]+[,]*)+)/)[0].length;
					//thousands position so that long scale doesn't have too many digits
					var thsPos=MOD.prefs.comma?str.lastIndexOf('.'):str.lastIndexOf(',');
					var add='';
					if (thsPos==-1)
					{
						if (decAmount==0) MOD.prefs.comma?add+=',000':add+='.000';
						else
						{
							if (decAmount==1) add+='00';
							if (decAmount==2) add+='0';
						}
					}
					str=[str.slice(0,(decPos!=-1)?nrmAmount+decAmount+1:nrmAmount+1),add,str.slice((decPos!=-1)?nrmAmount+decAmount+1:nrmAmount+1)].join('');
				}
				
				str=loc("%1 cookie",{n:Math.round(Game.cookiesd),b:str});
				if (str.length>14) str=str.replace(' ','<br>');
				
				if (Game.prefs.monospace) str='<span class="monospace">'+str+'</span>';
				str+=l('cookiesPerSecond').outerHTML;
				l('cookies').innerHTML=str;
				Timer.track('cookie amount(mod)');
		}}
		
		Game.registerHook('draw', drawCookieAmount);

		Game.Notify('New options for number formatting!', 'Is this necessary?', [30,29],10,1);
	},

	save:function(){
		return String(this.prefs.long*1+this.prefs.short*2+this.prefs.comma*4);
	},

	load:function(str){
        str=parseInt(str);
        if(str&1) {this.prefs.long=1;} else {this.prefs.long=0;};
		if(str&2) {this.prefs.short=1;} else {this.prefs.short=0;};
		if(str&4) {this.prefs.comma=1;} else {this.prefs.comma=0;};
		LocalizeUpgradesAndAchievs();
		Game.RefreshStore();
		Game.upgradesToRebuild=1;
	},
    //Copied from main.js and modified so that the prefs get added to MOD and not Game
    WritePrefButton:function(prefName,button,on,off,callback,invert){
        var invert=invert?1:0;
        if (!callback) callback='';
        callback+='PlaySound(\'snd/tick.mp3\');';
        return '<a class="smallFancyButton prefButton option'+((Game.mods['srkNumberFormatting'].prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="Game.mods[\'srkNumberFormatting\'].Toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(Game.mods['srkNumberFormatting'].prefs[prefName]?on:off)+'</a>';
    },

    Toggle:function(prefName,button,on,off,invert){
        if (Game.mods['srkNumberFormatting'].prefs[prefName])
        {
            l(button).innerHTML=off;
            Game.mods['srkNumberFormatting'].prefs[prefName]=0;
        }
        else
        {
            l(button).innerHTML=on;
            Game.mods['srkNumberFormatting'].prefs[prefName]=1;
        }
        l(button).className='smallFancyButton prefButton option'+((Game.mods['srkNumberFormatting'].prefs[prefName]^invert)?'':' off');
    },

	//I need to change this two variables as soon as I change the commas option... Ok I don't NEED to, but I want to
	CheckTheCommas:function(){
		//I use Elder Pact as a way to get the current decimal separator
		currentDec=(Game.UpgradesById[73].ddesc.search(/(?<=\d)\.(?=\d)/)!=-1)?'.':',';
		wantedDec=Game.mods['srkNumberFormatting'].prefs.comma?',':'.';
		beautifyInTextFilter=(currentDec=='.')?/(([\d]+[,]*)+)/g:/(([\d]+[.]*)+)/g;//new regex(mega new)
		//Replace dots or commas in text that are used as decimal separators (in between numbers) (this work because we haven't beautified the numbers yet, so they don't have thousand separators)
		decimalInTextFilter=(currentDec=='.')?/(?<=\d)\.(?=\d)/g:/(?<=\d),(?=\d)/;
		BeautifyInTextFunction=function(str){return Beautify(parseFloat((currentDec=='.')?str.replace(/,/g,''):str.replace(/\./g,''),10));};
		//Use pilcrow (¶) as a placeholder for decimal separators. This will break if anyone uses a pilcrow in ther loc files... why would you?
		BeautifyInText=function(str) {return str.replace(decimalInTextFilter,'¶').replace(beautifyInTextFilter,BeautifyInTextFunction).replace('¶',(wantedDec==',')?',':'.');}//now changes decimal dots and commas
	},
});
