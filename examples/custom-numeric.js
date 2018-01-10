const SWindow = require("../index");

// Calculates the variance
SWindow.register("numeric","variance",["stdev"],
	(currval,newitems,olditems,allitems,newstats,oldstats)=>{
		return Math.pow(newstats.stdev.stdev,2);
	}
);

// A Weighted sum, where value decreases as more items are pushed
// to the window
SWindow.register("numeric","decsum",[],
	(currval,newitems,olditems,allitems,newstats,oldstats)=>{
		currval = currval || {};
		if(!currval.ratio) currval.ratio = 0.99;
		if(!currval.weight) currval.weight = 1.0;
		if(!currval.sum) currval.sum = 0;

		var oldWeight = currval.weight;
		var newWeight = oldWeight * currval.ratio;

		var olen = olditems.length;
		var nlen = newitems.length;

		// Adds the new items, and append the weight values, so
		// we can fetch them in the substract phase
		for(let i=0;i<nlen;i++) {
			newitems[i].weight = newWeight;
			currval.sum += newitems[i].v * newWeight;
		}

		// Substract the removed items
		for(let i=0;i<olen;i++) {
			currval.sum -= olditems[i].v * olditems[i].weight;
		}

		currval.weight = newWeight;
		return currval;
	}
);

var sw = new SWindow.SizeStats(10,{
	ops : ["variance","decsum"],
	stats : {decsum : {ratio : 0.99}}
});

for(let i=0;i<100;i++) {
	sw.push(10);
	sw.push(5);
}
console.log(sw.stats);
