module.exports = {
	sum(currval,newitems,olditems,allitems,newstats,oldstats) {
		currval = currval===undefined? {} : currval;
		var ln = newitems.length, lo = olditems.length;
		for(let i=0;i<ln;i++) {
			for(let j in newitems[i].v) {
				currval[j] = currval[j] || 0;
				currval[j] += newitems[i].v[j];
			}
		}
		for(let i=0;i<lo;i++) {
			for(let j in olditems[i].v) {
				currval[j] = currval[j] || 0;
				currval[j] -= olditems[i].v[j];
			}
		}
		return currval;
	},
	freq(currval,newitems,olditems,allitems,newstats,oldstats) {
		var sums = newstats.sum;
		var total = 0, res = {};
		for(let i in sums) total += sums[i];
		for(let i in sums) res[i] = sums[i] / total;
		return res;
	},
	mode(currval,newitems,olditems,allitems,newstats,oldstats) {
		var sums = newstats.sum;
		var map = [];
		for(let i in sums) map.push({k:i,t:sums[i]});
		map.sort((a,b)=>a.t-b.t);
		return (map.pop()||{}).k;
	}
}
