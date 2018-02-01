const	TimeStats = require("../index").TimeStats;

// Create a time window of 10 secons.
// Window will slide on each second
var sw = new TimeStats(10000,{step:1000,timestamp:TimeStats.TS.RELATIVE});
var i=0;

sw.push({ts:10,v:1});
sw.push({ts:11,v:2});
sw.push({ts:12,v:3});
sw.push({ts:13,v:4});
sw.push({ts:14,v:5});
sw.push({ts:1015,v:6});
sw.push({ts:1025,v:7});
sw.push({ts:2015,v:8});

console.log(sw.window);
