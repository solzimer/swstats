const
	NOps = require("./nops"),
	COps = require("./cops");

// Default operations
const DEF_OPS = {
	numeric : ["count","sum","max","min","avg","stdev"],
	category : ["sum","freq","mode"]
};

// Stats function type constants
const TYPES = {
	numeric : "numeric",
	category : "category"
};

// Registered operations
const OPS = {
	numeric : {
		"count" : {fn:NOps.count,deps:[]},
		"sum" : {fn:NOps.sum,deps:[]},
		"max" : {fn:NOps.max,deps:[]},
		"min" : {fn:NOps.min,deps:[]},
		"avg" : {fn:NOps.avg,deps:[]},
		"stdev" : {fn:NOps.stdev,deps:["avg"]},
	},
	category : {
		"sum" : {fn:COps.sum,deps:[]},
		"freq" : {fn:COps.freq,deps:["sum"]},
		"mode" : {fn:COps.mode,deps:["sum"]}
	}
};

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

module.exports = {
	NOps,
	COps,
	RXOps:OPS,
	DEFOps:DEF_OPS,
	Types:TYPES,
	register
}
