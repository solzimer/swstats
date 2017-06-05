var data = [];
const MAX = 10000;

for(let i=0;i<1000;i++) {
	var r = Math.random();
	if(r>=0 && r<0.33) data.push(r);
	else if(r>=0.33 && r<0.66) data.push(r+4);
	else data.push(r+9);
}

function kmeans(data,k) {
	var ks = [], idxs = [], len = data.length;
	var conv = false, it = MAX;

	for(let i=0;i<k;i++) {
		ks.push(data[Math.floor(Math.random()*len)]);
	}

	do {
		for(let i=0;i<len;i++) {
			let min = Infinity, idx = 0;
			for(let j=0;j<k;j++) {
				var dist = Math.abs(data[i]-ks[j]);
				if(dist<min) {
					min = dist;
					idx = j;
				}
			}
			idxs[i] = idx;
		}

		var count = [], sum = [], old = [], dif = 0;
		for(let j=0;j<k;j++) {
			count[j] = sum[j] = 0;
			old[j] = ks[j];
		}

		for(let i=0;i<len;i++) {
			sum[idxs[i]] += data[i];
			count[idxs[i]]++;
		}

		for(let j=0;j<k;j++) {
			ks[j] = sum[j]/count[j] || 0;
			dif += old[j] - ks[j];
		}

		conv = (dif==0) || (--it<=0);
	}while(!conv);

	return {
		it : MAX-it,
		k : k,
		idxs : idxs,
		centroids : ks
	}
}

var ti = Date.now();
for(var i=0;i<10000;i++) {
	var res = kmeans(data,3);
	//console.log(res.it,res.centroids);
}
var tf = Date.now();

console.log(tf-ti);
