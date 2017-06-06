const
	SWindow = require("../main.js"),
	TimeStats = SWindow.TimeStats;

SWindow.register("category","threshold",["freq"],(curr,nvals,ovals,vals,nstats,ostats)=>{
	var map = {};
	for(var i in nstats.freq) {
		map[i] = nstats.freq[i]>0.6? true : false;
	}
	return map;
},true);

var sw = new TimeStats(10000);

setInterval(()=>{
	sw.push(Math.random()>0.6?0.5:0.2);
});

setInterval(()=>{
	console.log(sw.stats);
},100);
