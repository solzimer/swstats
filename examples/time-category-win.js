const
	SWindow = require("../index"),
	TimeStats = SWindow.TimeStats;

SWindow.register("category","threshold",["freq"],(curr,nvals,ovals,vals,nstats,ostats)=>{
	var map = {};
	for(var i in nstats.freq) {
		map[i] = nstats.freq[i]>0.6? true : false;
	}
	return map;
},true);

var sw = new TimeStats(10000,{type:"category"});

setInterval(()=>{
	sw.push(Math.random()>0.6?"John":"David");
});

setInterval(()=>{
	console.log(sw.window);
},100);
