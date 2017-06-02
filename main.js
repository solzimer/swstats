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
			sws.stats[op] = NOps[op](sws.stats[op],[],old,sws._arr);
		});
	});
},IVAL);

const NOps = {
	count(currval,newitems,olditems,allitems) {
		var t = 0, len = allitems.length;
		for(var i=0;i<len;i++) t += allitems[i].l;
		return t;
	},
	sum(currval,newitems,olditems,allitems) {
		if(this.d) debugger;
		if(!olditems.length) {
			this.d = true;
		}

		currval = currval===undefined? 0 : currval;
		var ln = newitems.length, lo = olditems.length;
		for(let i=0;i<ln;i++) currval += newitems[i].v;
		for(let i=0;i<lo;i++) currval -= olditems[i].v;
		//console.log(newitems,olditems,currval);
		return currval;
	},
	avg(currval,newitems,olditems,allitems) {
		var
			ln = this.count(0,0,0,newitems), lo = this.count(0,0,0,olditems),
			nvl = this.count(0,0,0,allitems), ovl = nvl-ln+lo;

		currval = currval===undefined? 0 : currval;
		currval = currval * ovl;

		for(let i=0;i<newitems.length;i++) currval += newitems[i].v;
		for(let i=0;i<olditems.length;i++) currval -= olditems[i].v;
		currval = currval / nvl;
		return isNaN(currval)? 0 : currval;
	},
}

class TimeStats {
	constructor(time,ops) {
		this._arr = [];
		this._time = time || 10000;
		this._ops = ops || DEF_NOPS;
		this._step = 1000;
		this.stats = {};
		LIST.push(this);
	}
	push(vals) {
		var now = Date.now();
		var arr = this._arr;

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
				this.stats[op] = NOps[op](this.stats[op],na,oa,arr);
			});
		}
		else {
			vals.forEach(v=>{arr.push(v)});
			this._ops.forEach(op=>{
				this.stats[op] = NOps[op](this.stats[op],vals,[],arr);
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
	a.push(Math.random());
});

setInterval(()=>{
	console.log(a.stats);
},100);
