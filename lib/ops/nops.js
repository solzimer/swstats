const OPS = {
	count(currval,newitems,olditems,allitems,newstats,oldstats) {
		var t = 0, len = allitems.length;
		for(var i=0;i<len;i++) t += (allitems[i].l||1);
		return t;
	},
	sum(currval,newitems,olditems,allitems,newstats,oldstats) {
		currval = currval===undefined? 0 : currval;
		var ln = newitems.length, lo = olditems.length;
		for(let i=0;i<ln;i++) currval += newitems[i].v;
		for(let i=0;i<lo;i++) currval -= olditems[i].v;

		return currval;
	},
	max(currval,newitems,olditems,allitems,newstats,oldstats) {
		var max = -Infinity, len = allitems.length;
		for(let i=0;i<len;i++)
			max = Math.max(max,allitems[i].max);
		return max;
	},
	min(currval,newitems,olditems,allitems,newstats,oldstats) {
		var min = Infinity, len = allitems.length;
		for(let i=0;i<len;i++)
			min = Math.min(min,allitems[i].min);
		return min;
	},
	avg(currval,newitems,olditems,allitems,newstats,oldstats) {
		var
			ln = OPS.count(0,0,0,newitems), lo = OPS.count(0,0,0,olditems),
			nvl = OPS.count(0,0,0,allitems), ovl = nvl-ln+lo;

		currval = currval===undefined? 0 : currval;
		currval = currval * ovl;

		for(let i=0;i<newitems.length;i++) currval += newitems[i].v;
		for(let i=0;i<olditems.length;i++) currval -= olditems[i].v;
		currval = currval / nvl;
		return isNaN(currval)? 0 : currval;
	},
	stdev(currval,newitems,olditems,allitems,newstats,oldstats) {
		oldstats.stdev = oldstats.stdev || {avg:1,sqsum:0,sum:0,stdev:0};

		var
			ln = OPS.count(0,0,0,newitems), lo = OPS.count(0,0,0,olditems),
			nvl = OPS.count(0,0,0,allitems), ovl = nvl-ln+lo,
			len = allitems.length,
			oavg = oldstats.avg || 0;

		var oldavg = oldstats.stdev.avg;
		var oldsqsum = oldstats.stdev.sqsum;
		var oldsum = oldstats.stdev.sum;
		var newavg = newstats.avg || 0;
		var newsqsum = oldsqsum;
		var newsum = oldsum;

		for(let i=0;i<olditems.length;i++) {
			let it = olditems[i].v / (olditems[i].l||1);
			newsqsum -= it*it;
			newsum -= it;
		}

		for(let i=0;i<newitems.length;i++) {
			let it = newitems[i].v / (newitems[i].l||1);
			newsqsum += it*it;
			newsum += it;
		}

		var stdev = Math.sqrt((newsqsum - 2*newavg*newsum + len*newavg*newavg) / len);
		return {
			avg : newavg,
			sqsum : newsqsum,
			sum : newsum,
			stdev : stdev
		}
	}
}

module.exports = OPS;
