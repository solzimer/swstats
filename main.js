const IVAL = 1000;
const LIST = [];

const DEF_NOPS = ["sum","count","avg"];
const DEF_COPS = ["sum","count","freq"];

setInterval(()=>{
	var now = Date.now();
	LIST.forEach(sws=>{
		var arr = sws._arr, time = sws._time;
		var old = [];

		while(arr.length && now-arr[0].t>time)
			old.push(arr.shift());

		sws._ops.forEach(op=>{
			sws[op] = NOps[op](sws[op],[],old,sws._arr);
		});
	});
},IVAL);

const NOps = {
	sum(currval,newitems,olditems,allitems) {
		currval = currval===undefined? 0 : currval;
		var ln = newitems.length, lo = olditems.length;
		for(var i=0;i<ln;i++) currval += newitems[i].v;
		for(var i=0;i<lo;i++) currval -= olditems[i].v;
		return currval;
	},
	count(currval,newitems,olditems,allitems) {
		return allitems.length;
	},
	avg(currval,newitems,olditems,allitems) {
		currval = currval===undefined? 0 : currval;
		var ln = newitems.length, lo = olditems.length;
		var ovl = allitems.length-ln+lo, nvl = allitems.length;

		currval = currval * ovl;
		for(var i=0;i<ln;i++) currval += newitems[i].v;
		for(var i=0;i<lo;i++) currval -= olditems[i].v;
		currval = currval / nvl;
		return isNaN(currval)? 0 : currval;
	},
}

class TimeStats {
	constructor(time,ops) {
		this._arr = [];
		this._time = time || 10000;
		this._ops = ops || DEF_NOPS;
		LIST.push(this);
	}
	push(vals) {
		var now = Date.now();
		vals = (vals instanceof Array? vals : [vals]).map(v=>{
			return {t:now,v:v};
		});
		vals.forEach(v=>this._arr.push(v));
		this._ops.forEach(op=>{
			this[op] = NOps[op](this[op],vals,[],this._arr);
		});
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
			return {v:v};
		});
		vals.forEach(v=>this._arr.push(v));
		while(this._arr.length>this._size) {
			old.push(this._arr.shift());
		}
		this._ops.forEach(op=>{
			this[op] = NOps[op](this[op],vals,old,this._arr);
		});
		return this;
	}
}

var a = new SizeStats;

setInterval(()=>{
	a.push(Math.random()>0.5? 1 : 0);
});

setInterval(()=>{
	console.log(a.count,a.sum,a.avg);
},100);
