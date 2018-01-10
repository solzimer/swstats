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

/**
 * SizeStats Slide Window
 * @class
 */
class SizeStats {
	/**
	 * @param {numeric} size Number of maximum slots before slide
	 * @param {[type]} options Options
	 */
	constructor(size,options) {
		options = options || DEF_OPTIONS;

		this._options = options;
		this._arr = [];
		this._size = size || 1000;
		this._type = options.type || DEF_OPTIONS.type;
		this._ops = options.ops || DEFOps[this._type];
		this.stats = Util.clone(options.stats||{});

		Util.sortOps(this._ops,this._type);
	}

	clean() {
		this._arr = [];
		this._oldstats = {};
		this.stats = Util.clone(this._options.stats||{});
	}

	get length() {
		return this._arr.length;
	}

	push(vals) {
		vals = vals instanceof Array? vals : [vals];

		return this._type==Types.numeric?
			this._pushNum(vals) :
			this._pushCat(vals);
	}

	_pushNum(vals) {
		var arr = this._arr, old = [];
		var type = this._type;
		var oldstats = Util.clone(this.stats);

		vals = vals.map(v=>{return {v:v,l:1,max:v,min:v};});
		vals.forEach(v=>this._arr.push(v));

		while(this._arr.length>this._size) {
			old.push(this._arr.shift());
		}

		this._ops.forEach(op=>{
			this.stats[op] = RXOps[type][op].fn(this.stats[op],vals,old,arr,this.stats,oldstats);
		});

		return this;
	}

	_pushCat(vals) {
		var arr = this._arr, old = [];
		var type = this._type;
		var oldstats = Util.clone(this.stats);
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
			this.stats[op] = RXOps[type][op].fn(this.stats[op],[map],old,arr,this.stats,oldstats);
		});

		return this;
	}

	get window() {
		let type = this._type;
		let win = this._arr.map(slot=>{
			let ops = {};
			this._ops.forEach(op=>{
				ops[op] = RXOps[type][op].fn(undefined,[slot],[],[slot],ops,{});
			});
			return ops;
		});
		return win;
	}	
}

module.exports = SizeStats;
