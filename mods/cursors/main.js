//Game.Loader.Replace is my hero
Game.registerMod("srkCursors",{
	init: function() {
        let MOD=this;
        MOD.prefs=[];

        //Replace updatemenu function to write the new buttons
        var menu = Game.UpdateMenu;
        Game.UpdateMenu = function(){
            menu();
            if(Game.onMenu == 'prefs'){
                //Remove old cursor button + label + break (maybe search for a way to identify them for certain)
                var crsrButton = document.getElementById("cursorsButton");
                crsrButton.nextSibling.nextSibling.remove();
                crsrButton.nextSibling.remove();
                crsrButton.remove();

                //New buttons
                var cursorButtons = document.createElement("div");
                cursorButtons.classList.add("listing");
                cursorButtons.innerHTML = "<div class='title'>Cursors</div>";
                //Old cursors button here for convenience
                cursorButtons.innerHTML += Game.WritePrefButton('cursors','cursorsButton',loc("Cursors [setting]")+ON,loc("Cursors [setting]")+OFF,'Game.mods[\'srkCursors\'].replaceCursors();')+'<label>('+loc("visual display of your cursors")+')</label><br>';
                cursorButtons.innerHTML += MOD.WritePrefButton('darkCursors','darkCursorButton',loc("Dark Cursors")+ON,loc("Dark Cursors")+OFF,'Game.mods[\'srkCursors\'].replaceCursors();')+'<label>('+loc("display dark cursors")+')</label><br>';
                cursorButtons.innerHTML += MOD.WritePrefButton('toonCursors','toonCursorButton',loc("Toon Cursors")+ON,loc("Toon Cursors")+OFF,'Game.mods[\'srkCursors\'].replaceCursors();')+'<label>('+loc("display tiny cursors")+')</label><br>';
                //Place buttons
				var allSections = document.querySelectorAll('#menu > div.block > div.subsection')
				var modsSection = allSections.length>2?document.querySelectorAll('#menu > div.block > div.subsection')[2]:document.querySelectorAll('#menu > div.block > div.subsection')[1];
				modsSection.append(cursorButtons);
            }
        }
		Game.Notify('Cursors 2.0!!!', 'With new(old) options!', [0,0],10,1);
	},

    save:function(){
		return String(this.prefs.darkCursors*1+this.prefs.toonCursors*2);
	},

	load:function(str){
        str=parseInt(str);
        if(str&1) {this.prefs.darkCursors=1;} else {this.prefs.darkCursors=0;};
        if(str&2) {this.prefs.toonCursors=1;} else {this.prefs.toonCursors=0;};
        Game.mods['srkCursors'].replaceCursors();
	},
    //Copied from main.js and modified so that the prefs get added to MOD and not Game
    WritePrefButton:function(prefName,button,on,off,callback,invert){
        var invert=invert?1:0;
        if (!callback) callback='';
        callback+='PlaySound(\'snd/tick.mp3\');';
        return '<a class="smallFancyButton prefButton option'+((Game.mods['srkCursors'].prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="Game.mods[\'srkCursors\'].Toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(Game.mods['srkCursors'].prefs[prefName]?on:off)+'</a>';
    },

    Toggle:function(prefName,button,on,off,invert){
        if (Game.mods['srkCursors'].prefs[prefName])
        {
            l(button).innerHTML=off;
            Game.mods['srkCursors'].prefs[prefName]=0;
        }
        else
        {
            l(button).innerHTML=on;
            Game.mods['srkCursors'].prefs[prefName]=1;
        }
        l(button).className='smallFancyButton prefButton option'+((Game.mods['srkCursors'].prefs[prefName]^invert)?'':' off');  
    },

    replaceCursors:function() {
        var num = Game.mods['srkCursors'].prefs.darkCursors*1+Game.mods['srkCursors'].prefs.toonCursors*2;
        if (isNaN(num)) num=0;
        Game.Loader.Replace('cursor.png',Game.mods['srkCursors'].dir+'/cursor'+num+'.png');
    },
});