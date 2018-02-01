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
	static get TS()  {
		return {
			ABSOLUTE : "absolute",
			RELATIVE : "relative"
		}
	}

	/**
	 * @param {numeric} time	Time (ms) of the duration of the window, before slide
	 * @param {object} options	options
	 */
	constructor(time,options) {
		options = options || DEF_OPTIONS;
		this._options = options;
		this._arr = [];
		this._time = time || 10000;
		this._tst = options.timestamp || TimeStats.TS.ABSOLUTE;
		this._type = options.type || DEF_OPTIONS.type;
		this._ops = options.ops || DEFOps[this._type];
		this._step = options.step || DEF_OPTIONS.step;
		this._pause = false;
		this._active = true;
		this._oldstats = {};
		this._mints = Infinity;
		this._maxts = -Infinity;
		this.stats = Util.clone(options.stats||{});

		Util.sortOps(this._ops,this._type);
		if(this._tst==TimeStats.TS.ABSOLUTE)
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

		if(this._tst==TimeStats.TS.ABSOLUTE) {
			return this._type==Types.numeric?
				this._pushNum(vals) :	this._pushCat(vals);
		}
		else {
			return this._type==Types.numeric?
				this._pushNumRel(vals) :	this._pushCatRel(vals);
		}
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
		if(idx>=0) LIST.splice(idx,1);
		this._active = false;
	}

	_pushNum(vals) {
		let
			now = Date.now(),
			arr = this._arr,
			type = this._type,
			oldstats = Util.clone(this.stats);

		// Map values to stat object
		vals = vals.map(v=>{return {t:now,v:v,l:1,max:v,min:v};});

		// First element in array
		if(!arr.length) arr.push({t:now,v:0,l:0,max:-Infinity,min:Infinity});

		// Value fits in current slot
		if(now-last.t < this._step) {
			// Clone the current slot to make the diff
			let last = Util.clone(arr[arr.length-1]);

			// Acumulate on the slot copy
			vals.forEach(v=>{
				last.v+=v.v; last.l+=1;
				last.max = Math.max(last.max,v.v),
				last.min = Math.min(last.min,v.v)
			});

			// Remove the original slot and push the copy
			var oa = [arr.pop()], na = [last];
			arr.push(last);

			// Apply operations
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

	_pushNumRel(vals) {
		let
			now = Date.now(),
			arr = this._arr,
			type = this._type,
			oldstats = Util.clone(this.stats);

		vals = vals.map(v=>{return {t:v.t||now,v:v.v,l:1,max:v.v,min:v.v};});

		vals.forEach(v=>{
			// First element
			if(!arr.length) {
				arr.push(v);
				this._mints = v.t;
				this._maxts = v.t;
				return;
			}

			// Ignore values older than current time window
			let tsdist = this._maxts - v.t;
			if(tsdist>this._time) return;

			// Find the closest slot by time difference
			let tss = arr.map((slot,i)=>{
				return {dt:Math.abs(slot.t-v.t),i:i}
			}).sort((a,b)=>{
				return b.dt-a.dt;
			}).pop();
			let slot = arr[tss.i];

			// Value fits in this slot
			if(Math.abs(v.t-slot.t)<this._step) {
				let cloned = Util.clone(slot);

				cloned.v+=v.v; cloned.l+=1;
				cloned.max = Math.max(cloned.max,v.v),
				cloned.min = Math.min(cloned.min,v.v)

				// Remove the original slot and push the copy
				var oa = arr.splice(tss.i,1), na = [cloned];
				arr.push(cloned);

				// Apply operations
				this._ops.forEach(op=>{
					this.stats[op] = RXOps[type][op].fn(this.stats[op],na,oa,arr,this.stats,oldstats);
				});
			}
			// Create a new slot
			else {
				arr.push(v);
				this._ops.forEach(op=>{
					this.stats[op] = RXOps[type][op].fn(this.stats[op],[v],[],arr,this.stats,oldstats);
				});
			}

			// Update window time range
			this._mints = Math.min(v.t,this._mints);
			this._maxts = Math.max(v.t,this._maxts);
			oldstats = Util.clone(this.stats);
		});

		// Sort window
		arr.sort((a,b)=>a.t-b.t);

		// Remove old slots
		let old = [];
		while(Math.abs(this._mints-this._maxts)>this._time) {
			old.push(arr.shift());
			this._mints = arr[0].t;
		}

		// Refresh operations
		if(old.length) {
			this._ops.forEach(op=>{
				this.stats[op] = RXOps[type][op].fn(this.stats[op],[],old,arr,this.stats,oldstats);
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

	_pushCatRel(vals) {
		let
			arr = this._arr,
			type = this._type,
			oldstats = Util.clone(this.stats);

		vals.forEach(v=>{
			// First element
			if(!arr.length) {
				arr.push({t:v.t,v:{[v.v]:1}});
				this._mints = v.t;
				this._maxts = v.t;
				return;
			}

			// Ignore values older than current time window
			let tsdist = this._maxts - v.t;
			if(tsdist>this._time) return;

			// Find the closest slot by time difference
			let tss = arr.map((slot,i)=>{
				return {dt:Math.abs(slot.t-v.t),i:i}
			}).sort((a,b)=>{
				return b.dt-a.dt;
			}).pop();
			let slot = arr[tss.i];

			// Value fits in this slot
			if(Math.abs(v.t-slot.t)<this._step) {
				let cloned = Util.clone(slot);

				cloned.v[v.v] = cloned.v[v.v] || 0;
				cloned.v[v.v] += 1;

				// Remove the original slot and push the copy
				var oa = arr.splice(tss.i,1), na = [cloned];
				arr.push(cloned);

				// Apply operations
				this._ops.forEach(op=>{
					this.stats[op] = RXOps[type][op].fn(this.stats[op],na,oa,arr,this.stats,oldstats);
				});
			}
			// Create a new slot
			else {
				let newslot = {t:v.t,v:{[v.v]:1}};
				arr.push(newslot);
				this._ops.forEach(op=>{
					this.stats[op] = RXOps[type][op].fn(this.stats[op],newslot,[],arr,this.stats,oldstats);
				});
			}

			// Update window time range
			this._mints = Math.min(v.t,this._mints);
			this._maxts = Math.max(v.t,this._maxts);
			oldstats = Util.clone(this.stats);
		});

		// Sort window
		arr.sort((a,b)=>a.t-b.t);

		// Remove old slots
		let old = [];
		while(Math.abs(this._mints-this._maxts)>this._time) {
			old.push(arr.shift());
			this._mints = arr[0].t;
		}

		// Refresh operations
		if(old.length) {
			this._ops.forEach(op=>{
				this.stats[op] = RXOps[type][op].fn(this.stats[op],[],old,arr,this.stats,oldstats);
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
