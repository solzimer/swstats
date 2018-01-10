const RXOps = require("./ops").RXOps;

/**
 * Simple object clone function
 */
function clone(obj) {
	if(typeof(obj)!="object") {
		return obj;
	}
	else {
		var o = {};
		for(var i in obj) o[i] = clone(obj[i]);
		return o;
	}
}

function depends(a,b,type) {
	var deps = RXOps[type][a].deps;
	if(!deps.length) return false;
	else if(deps.indexOf(b)>=0) return true;
	else {
		return deps.reduce((curr,val)=>curr||depends(val,b,type),false);
	}
}

/**
 * Sorts category operations by its dependencies
 */
function sortOps(ops,type) {
	var map = {}, n = false;

	ops.forEach(op=>map[op] = true);
	do {
		n = false;
		ops.forEach(op=>{
			RXOps[type][op].deps.forEach(dep=>{
				if(!map[dep]) {
					map[dep] = true;
					ops.push(dep);
					n = true;
				};
			});
		});
	}while(n);

	// Stupid sort because Array.sort will not work with dependency sorting
	if(ops.length>1) {
		let tmp = null, it = false;
		do {
			it = false;
			for(let i=0;i<ops.length;i++) {
				for(let j=i;j<ops.length;j++) {
					if(depends(ops[i],ops[j],type)) {
						tmp = ops[i];
						ops[i] = ops[j];
						ops[j] = tmp;
						it = true;
					}
				}
			}
		}while(it);
	}
}

module.exports = {clone,depends,sortOps}
