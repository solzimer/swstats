const	TimeStats = require("../main.js").TimeStats;

// Create a time window of 10 secons.
// Window will slide on each second
var sw = new TimeStats(10000,{step:1000});
var i=0;

setInterval(()=>{
	sw.push(Math.random());
},10);

setInterval(()=>{
	console.log(sw.window);
},100);
