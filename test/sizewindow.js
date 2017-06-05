const
	SWindow = require("../main.js"),
	SizeStats = SWindow.SizeStats;

SWindow.register("category","threshold",["freq"],(curr,nvals,ovals,vals,nstats,ostats)=>{
	var map = {};
	for(var i in nstats.freq) {
		map[i] = nstats.freq[i]>0.6? true : false;
	}
	return map;
});

var sw = new SizeStats(1000,{type:"category",ops:["threshold"]});

setInterval(()=>{
	sw.push(Math.random()>0.6?"David":"John");
});

setInterval(()=>{
	console.log(sw.stats);
},100);
