//What would happen if we use an achievement enabler as well?
Game.registerMod("srkSteamAchievementBlocker",{
	init: function() {
		if(Steam){
			Steam.allowSteamAchievs = false;
		}
		Game.Notify('Your achievements have been disabled.', 'You know you could have just... used the sample mod right?', [10,6],10,1);
	},
});