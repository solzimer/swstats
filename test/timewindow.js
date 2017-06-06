const
	SWindow = require("../main.js"),
	TimeStats = SWindow.TimeStats;

var sw = new TimeStats(10000);

setInterval(()=>{
	sw.push(Math.random()>0.6?0.5:0.2);
});

setInterval(()=>{
	console.log(sw.stats);
},100);
