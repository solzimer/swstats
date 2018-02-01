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

var sw = new TimeStats(10000,{type:"category",timestamp:TimeStats.TS.RELATIVE});

sw.push({t:1,v:"Value1"});
sw.push({t:2,v:"Value2"});
sw.push({t:3,v:"Value2"});
sw.push({t:4,v:"Value2"});
sw.push({t:5,v:"Value1"});
sw.push({t:1002,v:"Value1"});
sw.push({t:1003,v:"Value2"});
sw.push({t:1004,v:"Value2"});
sw.push({t:2005,v:"Value1"});
sw.push({t:2006,v:"Value1"});
sw.push({t:1007,v:"Value1"});
sw.push({t:1008,v:"Value1"});
sw.push({t:11000,v:"Slide"});
sw.push({t:10,v:"Ignored"});
sw.push({t:2003,v:"InPlace"});

console.log(sw.window);
