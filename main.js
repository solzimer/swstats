const NOps = require("./nops.js");
const COps = require("./cops.js");

const IVAL = 1000;	// Slide window interval
const LIST = [];		// Active window instances

// Stats function type constants
const TYPES = {
	numeric : "numeric",
	category : "category"
};

// Default operations
const DEF_OPS = {
	numeric : ["count","sum","avg","stdev"],
	category : ["sum","freq","mode"]
}

// Default options
const DEF_OPTIONS = {
	type : TYPES.numeric,
	ops : DEF_OPS.numeric,
	step : 1000
}

// Registered operations
const OPS = {
	numeric : {
		"count" : {fn:NOps.count,deps:[]},
		"sum" : {fn:NOps.sum,deps:[]},
		"avg" : {fn:NOps.avg,deps:[]},
		"stdev" : {fn:NOps.stdev,deps:["avg"]},
	},
	category : {
		"sum" : {fn:COps.sum,deps:[]},
		"freq" : {fn:COps.freq,deps:["sum"]},
		"mode" : {fn:COps.mode,deps:["sum"]}
	}
}

/**
 * Simple object clone function
 */
function clone(obj) {
	if(typeof(obj)!="object") {
		return obj;
	}
	else {
		var o = {};
		for(var i in obj) o[i] = clone(obj[i]);
		return o;
	}
}

/**
 * Registers a new operation
 * @param type [TYPES.numeric / TYPES.category]
 * @param name The name of the stat function
 * @param deps Array of dependency names
 * @param fn Stats function to be called, in the form of
 * fn(currval,newitems,olditems,allitems,newstats,oldstats)
 * @param def Use by default.
 */
function register(type,name,deps,fn,def) {
	OPS[type][name] = {fn:fn,deps:deps};
	if(def) DEF_OPS[type].push(name);
}

function depends(a,b,type) {
	var deps = OPS[type][a].deps;
	if(!deps.length) return false;
	else if(deps.indexOf(b)>=0) return true;
	else {
		return deps.reduce((curr,val)=>curr||depends(val,b,type),false);
	}
}

/**
 * Sorts category operations by its dependencies
 */
function sortOps(ops,type) {
	var map = {}, n = false;

	ops.forEach(op=>map[op] = true);
	do {
		n = false;
		ops.forEach(op=>{
			OPS[type][op].deps.forEach(dep=>{
				if(!map[dep]) {
					map[dep] = true;
					ops.push(dep);
					n = true;
				};
			});
		});
	}while(n);

	ops.sort((a,b)=>{
		if(depends(a,b,type)) return 1;
		else if(depends(b,a,type)) return -1;
		else return 0;
	});
}

/**
 * Slide time window interval
 */
setInterval(()=>{
	var now = Date.now();

	// For each stat created object
	LIST.filter(sws=>!sws._pause).forEach(sws=>{
		var arr = sws._arr, time = sws._time;
		var type = sws._type;
		var old = [];
		var oldstats = clone(sws.stats);

		// Remove slots whose date has expired
		while(arr.length && now-arr[0].t>time)
			old.push(arr.shift());

		// Execute each stat operation over the remaining slots
		sws._ops.forEach(op=>{
			sws.stats[op] = OPS[type][op].fn(sws.stats[op],[],old,sws._arr,sws.stats,oldstats);
		});
	});
},IVAL);

/**
 * TimeStats Slide Window
 * @param time Time (ms) of the duration of the window, before slide
 * @param options Object
 */
class TimeStats {
	constructor(time,options) {
		options = options || DEF_OPTIONS;
		this._options = options;
		this._arr = [];
		this._time = time || 10000;
		this._type = options.type || DEF_OPTIONS.type;
		this._ops = options.ops || DEF_OPS[this._type];
		this._step = options.step || DEF_OPTIONS.step;
		this._pause = false;
		this._active = true;
		this._oldstats = {};
		this.stats = clone(options.stats||{});

		sortOps(this._ops,this._type);
		LIST.push(this);
	}

	get length() {
		return this._arr.length;
	}

	clean() {
		this._arr = [];
		this._oldstats = {};
		this.stats = clone(this._options.stats||{});
	}

	push(vals) {
		if(!this._active || this._pause) return;

		vals = vals instanceof Array? vals : [vals];

		return this._type==TYPES.numeric?
			this._pushNum(vals) :
			this._pushCat(vals);
	}

	pause() {
		this._pause = true;
	}

	resume(shift) {
		var arr = this._arr;
		if(shift && arr.length) {
			var now = Date.now();
			var last = arr[arr.length].t;
			var diff = now - last;
			arr.length.forEach(v=>v.t+=diff);
		}
		this._pause = false;
	}

	destroy() {
		var idx = LIST.indexOf(this);
		LIST.splice(idx,1);
		this._active = false;
	}

	_pushNum(vals) {
		var now = Date.now();
		var arr = this._arr;
		var type = this._type;
		var oldstats = clone(this.stats);

		vals = vals.map(v=>{return {t:now,v:v,l:1};});

		if(!arr.length) arr.push({t:now,v:0,l:0});
		var last = clone(arr[arr.length-1]);

		if(now-last.t < this._step) {
			vals.forEach(v=>{last.v+=v.v; last.l+=1;});
			var oa = [arr.pop()], na = [last];
			arr.push(last);
			this._ops.forEach(op=>{
				this.stats[op] = OPS[type][op].fn(this.stats[op],na,oa,arr,this.stats,oldstats);
			});
		}
		else {
			vals.forEach(v=>{arr.push(v)});
			this._ops.forEach(op=>{
				this.stats[op] = OPS[type][op].fn(this.stats[op],vals,[],arr,this.stats,oldstats);
			});
		}

		return this;
	}

	_pushCat(vals) {
		var now = Date.now();
		var arr = this._arr;
		var type = this._type;
		var oldstats = clone(this.stats);
		var map = {}

		vals.forEach(v=>{
			map[v] = map[v] || 0;
			map[v]++;
		});

		if(!arr.length) arr.push({t:now,v:{}});
		var last = clone(arr[arr.length-1]);

		if(now-last.t < this._step) {
			for(let i in map) {
				last.v[i] = last.v[i] || 0;
				last.v[i] += map[i];
			}
			var oa = [arr.pop()], na = [last];
			arr.push(last);
			this._ops.forEach(op=>{
				this.stats[op] = OPS[type][op].fn(this.stats[op],na,oa,arr,this.stats,oldstats);
			});
		}
		else {
			var item = {t:now,v:map};
			arr.push(item);
			this._ops.forEach(op=>{
				this.stats[op] = OPS[type][op].fn(this.stats[op],[item],[],arr,this.stats,oldstats);
			});
		}

		return this;
	}
}

/**
 * SizeStats Slide Window
 * @param size Number of maximum slots before slide
 * @param options Object
 */
class SizeStats {
	constructor(size,options) {
		options = options || DEF_OPTIONS;

		this._options = options;
		this._arr = [];
		this._size = size || 1000;
		this._type = options.type || DEF_OPTIONS.type;
		this._ops = options.ops || DEF_OPS[this._type];
		this.stats = clone(options.stats||{});

		sortOps(this._ops,this._type);
	}

	clean() {
		this._arr = [];
		this._oldstats = {};
		this.stats = clone(this._options.stats||{});
	}

	get length() {
		return this._arr.length;
	}

	push(vals) {
		vals = vals instanceof Array? vals : [vals];

		return this._type==TYPES.numeric?
			this._pushNum(vals) :
			this._pushCat(vals);
	}

	_pushNum(vals) {
		var arr = this._arr, old = [];
		var type = this._type;
		var oldstats = clone(this.stats);

		vals = vals.map(v=>{return {v:v,l:1};});
		this._arr.push(vals);

		while(this._arr.length>this._size) {
			old.push(this._arr.shift());
		}

		this._ops.forEach(op=>{
			this.stats[op] = OPS[type][op].fn(this.stats[op],vals,old,arr,this.stats,oldstats);
		});

		return this;
	}

	_pushCat(vals) {
		var arr = this._arr, old = [];
		var type = this._type;
		var oldstats = clone(this.stats);
		var map = {v:{}};

		vals.forEach(v=>{
			map.v[v] = map.v[v] || 0;
			map.v[v]++;
		});
		this._arr.push(map);

		while(this._arr.length>this._size) {
			old.push(this._arr.shift());
		}

		this._ops.forEach(op=>{
			this.stats[op] = OPS[type][op].fn(this.stats[op],[map],old,arr,this.stats,oldstats);
		});

		return this;
	}
}

module.exports = {
	TimeStats : TimeStats,
	SizeStats : SizeStats,
	register : register
}
