const
	Operation = require("./ops"),
	Util = require("./util"),
	Types = Operation.Types,
	RXOps = Operation.RXOps,
	DEFOps = Operation.DEFOps;

// Default options
const DEF_OPTIONS = {
	type : Types.numeric,
	ops : DEFOps.numeric,
	step : 1000
};

const IVAL = 1000;	// Slide window interval
const LIST = [];		// Active window instances

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
		var oldstats = Util.clone(sws.stats);

		// Remove slots whose date has expired
		while(arr.length && now-arr[0].t>time)
			old.push(arr.shift());

		// Execute each stat operation over the remaining slots
		sws._ops.forEach(op=>{
			sws.stats[op] = RXOps[type][op].fn(sws.stats[op],[],old,sws._arr,sws.stats,oldstats);
		});
	});
},IVAL);


/**
 * TimeStats Slide Window
 * @class
 */
class TimeStats {
	/**
	 * @param {numeric} time	Time (ms) of the duration of the window, before slide
	 * @param {object} options	options
	 */
	constructor(time,options) {
		options = options || DEF_OPTIONS;
		this._options = options;
		this._arr = [];
		this._time = time || 10000;
		this._type = options.type || DEF_OPTIONS.type;
		this._ops = options.ops || DEFOps[this._type];
		this._step = options.step || DEF_OPTIONS.step;
		this._pause = false;
		this._active = true;
		this._oldstats = {};
		this.stats = Util.clone(options.stats||{});

		Util.sortOps(this._ops,this._type);
		LIST.push(this);
	}

	get length() {
		return this._arr.length;
	}

	clean() {
		this._arr = [];
		this._oldstats = {};
		this.stats = Util.clone(this._options.stats||{});
	}

	push(vals) {
		if(!this._active || this._pause) return;

		vals = vals instanceof Array? vals : [vals];

		return this._type==Types.numeric?
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
		var oldstats = Util.clone(this.stats);

		vals = vals.map(v=>{return {t:now,v:v,l:1,max:v,min:v};});

		if(!arr.length) arr.push({t:now,v:0,l:0,max:-Infinity,min:Infinity});
		var last = Util.clone(arr[arr.length-1]);

		if(now-last.t < this._step) {
			vals.forEach(v=>{
				last.v+=v.v; last.l+=1;
				last.max = Math.max(last.max,v.v),
				last.min = Math.min(last.min,v.v)
			});
			var oa = [arr.pop()], na = [last];
			arr.push(last);
			this._ops.forEach(op=>{
				this.stats[op] = RXOps[type][op].fn(this.stats[op],na,oa,arr,this.stats,oldstats);
			});
		}
		else {
			vals.forEach(v=>{arr.push(v)});
			this._ops.forEach(op=>{
				this.stats[op] = RXOps[type][op].fn(this.stats[op],vals,[],arr,this.stats,oldstats);
			});
		}

		return this;
	}

	_pushCat(vals) {
		var now = Date.now();
		var arr = this._arr;
		var type = this._type;
		var oldstats = Util.clone(this.stats);
		var map = {}

		vals.forEach(v=>{
			map[v] = map[v] || 0;
			map[v]++;
		});

		if(!arr.length) arr.push({t:now,v:{}});
		var last = Util.clone(arr[arr.length-1]);

		if(now-last.t < this._step) {
			for(let i in map) {
				last.v[i] = last.v[i] || 0;
				last.v[i] += map[i];
			}
			var oa = [arr.pop()], na = [last];
			arr.push(last);
			this._ops.forEach(op=>{
				this.stats[op] = RXOps[type][op].fn(this.stats[op],na,oa,arr,this.stats,oldstats);
			});
		}
		else {
			var item = {t:now,v:map};
			arr.push(item);
			this._ops.forEach(op=>{
				this.stats[op] = RXOps[type][op].fn(this.stats[op],[item],[],arr,this.stats,oldstats);
			});
		}

		return this;
	}

	get window() {
		let type = this._type;
		let win = this._arr.map(slot=>{
			let ops = {t:slot.t};
			this._ops.forEach(op=>{
				ops[op] = RXOps[type][op].fn(undefined,[slot],[],[slot],ops,{});
			});
			return ops;
		});
		return win;
	}	
}

module.exports = TimeStats;
