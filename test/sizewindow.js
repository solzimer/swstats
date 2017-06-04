const SizeStats = require("../main.js").SizeStats;

var sw = new SizeStats(1000,{category:true});

setInterval(()=>{
	sw.push(Math.random()>0.5?"David":"John");
});

setInterval(()=>{
	console.log(sw.stats);
},100);
