const	TimeStats = require("../index").TimeStats;

// Create a time window of 10 secons.
// Window will slide on each second
var sw = new TimeStats(10000,{step:1});
var i=0;

setInterval(()=>{
	sw.push(Math.random());
},10);

setInterval(()=>{
	console.log(sw.stats);
},100);
