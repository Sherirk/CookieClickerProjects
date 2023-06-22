/*Original code: Xep
Removed a lot of code at the top of the file.
Added the ability to update the counter without actually clicking, so that it doesn't stay at it's last value forever.
Modified counters and counterChunk values to have the cps fall quicker to zero.
Added a lot of commenting because I had no idea how anything worked and if I have to come back to this I want to know what's going on.
Modified the code to use hooks instead of events.
*/
Game.registerMod("srkClicksPerSecond",{
	init:function(){
		const config = {
			counters: 50,//How many elements our array of cliks will have. This pretty much means how much time we will consider when calculating CPS
			counterChunk: 20,//How much time (in miliseconds) will each element of our array represent
		};

		let MOD=this;

		//clickCounters is an array where each element represents an amount of ms passed, and the number of that element is how many clicks happened in that amount of time
		MOD.clickCounters = new Array(config.counters).fill(0);
		MOD.clickCounterTime = Math.floor(new Date().getTime()/config.counterChunk);
		
		CPSCalc=function(checking=false){
			click=true
			if (checking) click=false;
			const Differeance = (Math.floor(new Date().getTime()/config.counterChunk) - MOD.clickCounterTime);//Time between last click and now, divided by our counterchunk -> this means that Differeance is how many times counterchunk miliseconds have passed
			MOD.clickCounters = MOD.clickCounters.slice(Differeance).concat(new Array(Math.min(config.counters, Differeance)).fill(0));//We fill as many as Differeance elements of our clicks array with 0 (because that's how long we have not clicked our cookie)
			MOD.clickCounterTime = Math.floor(new Date().getTime()/config.counterChunk);//New last time since a click

			// Update CPS
			if (click) {
				MOD.clickCounters[MOD.clickCounters.length-1]++;//We add 1 click to the last array element (which is the current time) only if we are actually clicking
			}
			const CounterChunk = MOD.clickCounters.slice(0, -1);
			//Sum all but last amount of clicks
			//1000/counterchunk is how many ms each element of the array contains
			Game.clicksPs = (CounterChunk.reduce((a, b) => a+b, 0)/Math.max(1, CounterChunk.length)*1000/config.counterChunk || 0).toFixed(2);
			
			//Made all variables a property of Game so that other mods may use it if they want
			Game.trueClicksPs = Game.clicksPs > 50 ? (50).toFixed(2) : Game.clicksPs;  // Capped at 50 as of v2.048: Line 4795 of main.js - if (Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50)) {}
			//Og code used trueCPS instead of CPS for these ones, but I want my data more precise
			Game.cookiesPsByClicks = Game.computedMouseCps * Game.trueClicksPs;
		};

		CPSUpdate=function(){
			str=(Game.trueClicksPs!=0)?'<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="clickPerSecond"'+'>'+loc("CpS:")+' '+Game.trueClicksPs+'</div>':'';
			str+=(Game.trueClicksPs!=0&&Game.cookiesPsByClicks)?'<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="totalPerSecond"'+'>'+loc("Total per second:")+' '+Beautify(Game.cookiesPsByClicks+Game.cookiesPs*(1-Game.cpsSucked),1)+'</div>':'';
			l('cookies').innerHTML=l('cookies').innerHTML+str;
		}

		Game.registerHook('click', CPSCalc)
		
		Game.registerHook('logic',()=>CPSCalc(true));//Orteil let us run parameters pls

		Game.registerHook('draw',CPSUpdate);

		Game.registerHook('reset',function(hard){
			if (hard)
			{
				//Reset our array of clicks when starting a new save file
				MOD.clickCounters = new Array(config.counters).fill(0);
				MOD.clickCounterTime = Math.floor(new Date().getTime()/config.counterChunk);
			}
		});
	},
});