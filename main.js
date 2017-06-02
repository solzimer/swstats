const NOps = require("./nops.js");

const IVAL = 1000;
const LIST = [];
const DEF_NOPS = ["count","sum","avg","stdev"];
const DEF_COPS = ["sum","count","freq"];

setInterval(()=>{
	var now = Date.now();
	LIST.forEach(sws=>{
		var arr = sws._arr, time = sws._time;
		var old = [];
		var oldstats = clone(sws.stats);

		while(arr.length && now-arr[0].t>time)
			old.push(arr.shift());

		sws._ops.forEach(op=>{
			sws.stats[op] = NOps[op](sws.stats[op],[],old,sws._arr,sws.stats,oldstats);
		});
	});
},IVAL);

function clone(obj) {
	var o = {};
	for(var i in obj) o[i] = obj[i];
	return o;
}
class TimeStats {
	constructor(time,ops) {
		this._arr = [];
		this._time = time || 10000;
		this._ops = ops || DEF_NOPS;
		this._step = 1;
		this._oldstats = {};
		this.stats = {};
		LIST.push(this);
	}
	push(vals) {
		var now = Date.now();
		var arr = this._arr;
		var oldstats = clone(this.stats);

		if(!arr.length) arr.push({t:now,v:0,l:0});
		var last = arr[arr.length-1];
		last = {t:last.t,v:last.v,l:last.l};

		vals = (vals instanceof Array? vals : [vals]);
		vals = vals.map(v=>{return {t:now,v:v,l:1};});
		if(now-last.t < this._step) {
			vals.forEach(v=>{last.v+=v.v; last.l+=1;});
			var oa = [arr.pop()], na = [last];
			arr.push(last);
			this._ops.forEach(op=>{
				this.stats[op] = NOps[op](this.stats[op],na,oa,arr,this.stats,oldstats);
			});
		}
		else {
			vals.forEach(v=>{arr.push(v)});
			this._ops.forEach(op=>{
				this.stats[op] = NOps[op](this.stats[op],vals,[],arr,this.stats,oldstats);
			});
		}

		return this;
	}
}

class SizeStats {
	constructor(size,ops) {
		this._arr = [];
		this._size = size || 1000;
		this._ops = ops || DEF_NOPS;
	}
	push(vals) {
		var old = [];

		vals = (vals instanceof Array? vals : [vals]).map(v=>{
			return {v:v,l:0};
		});

		while(this._arr.length>this._size) {
			old.push(this._arr.shift());
		}

		this._ops.forEach(op=>{
			this[op] = NOps[op](this[op],vals,old,this._arr);
		});

		return this;
	}
}

var a = new TimeStats;

setInterval(()=>{
	a.push(Math.random()*10);
});

setInterval(()=>{
	console.log(a.stats);
},100);

/*
var a = [1,3,4,7,8,1,3,2,2,2,4,3];
var avg = a.reduce((curr,val)=>curr+val,0) / a.length;
var asum = a.reduce((curr,val)=>curr+Math.pow(val-avg,2),0);
var bsum = a.reduce((curr,val)=>curr+val*val,0) + avg*avg*a.length - 2*a.reduce((curr,val)=>curr+val*avg,0);
var stdev1 = Math.sqrt(asum/a.length);
var stdev2 = Math.sqrt(bsum/a.length);
console.log(avg,stdev1,stdev2);
*/
