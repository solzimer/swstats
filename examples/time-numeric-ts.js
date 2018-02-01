const	TimeStats = require("../index").TimeStats;

// Create a time window of 10 secons.
// Window will slide on each second
var sw = new TimeStats(10000,{step:1000,timestamp:TimeStats.TS.RELATIVE});
var i=0;

sw.push({t:10,v:1});
sw.push({t:11,v:2});
sw.push({t:12,v:3});
sw.push({t:13,v:4});
sw.push({t:14,v:5});
sw.push({t:1015,v:6});
sw.push({t:1025,v:7});
sw.push({t:2015,v:8});
sw.push({t:1025,v:9});
sw.push({t:11015,v:1});
sw.push({t:10,v:1000});

console.log(sw.window);
