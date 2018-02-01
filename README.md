# swstats
Sliding window statistics for Nodejs and browser.

[![Build Status](https://travis-ci.org/solzimer/swstats.svg?branch=master)](https://travis-ci.org/solzimer/swstats)

Time and Size sliding windows, capable of calculating incremental statistics, such as count, sum, avg, stdev, freq, etc...

## Features
* Nodejs and Browser compatible
* Time or size windows (not both)
* Global time or custom specified timestamp
* Numeric or category stats
* Stats are calculated incrementally, using online algorithms
* Core category stats: sum, frequency, mode
* Core numeric stats: count, sum, min, max, avg, stdev
* Plugable custom stats functions
* Time windows are slided each second

## Installation
```
npm install swstats
```

## Quick start
Nodejs:
```javascript
const	SWindow = require("swstats");

// Create a time window of 10 seconds. Each value pushed to
// the window will be stored in a unique slot (step:1)
// Window will slide on each second
var sw = new SWindow.TimeStats(10000,{step:1});
var i=0;

setInterval(()=>{
	sw.push(Math.random());
},1);

setInterval(()=>{
	console.log(sw.stats);
},100);
```
or browser:
```html
<!doctype html>
<html>
<head>
	<script src="swstats.min.js"></script>
</head>
<body>
	<textarea id="values" readonly="readonly" cols="40" rows="15">
	</textarea>

	<script>
		// Create a time window of 10 secons.
		// Window will slide on each second
		var sw = new SWindow.TimeStats(10000,{step:1});
		var i=0;
		var ta = document.getElementById("values");

		setInterval(()=>{
			sw.push(Math.random());
		},10);

		setInterval(()=>{
			ta.value = JSON.stringify(sw.stats,null,2);
		},100);
	</script>
</body>
</html>
```

The results will be something like:
```javascript
{ count: 9,
  sum: 4.383476926850223,
  avg: 0.48705299187224704,
  max: 0.9865126881294235,
  min: 0.0023880687887007923,
  stdev:
   { avg: 0.48705299187224704,
     sqsum: 2.6772528231211963,
     sum: 4.383476926850223,
     stdev: 0.24546266317028345 } }

....

{ count: 994,
  sum: 495.03542685194975,
  avg: 0.4980235682615189,
  max: 0.9865126881294235,
  min: 0.0023880687887007923,
  stdev:
   { avg: 0.4980235682615189,
     sqsum: 332.1783737578395,
     sum: 495.03542685194975,
     stdev: 0.29352342336095866 } }
```

## Time Window API
### new SWindow.TimeStats(time,[options])
Creates a new time window of *time* duration. The window will slide on each second.
*options* is optional, and can take the following parameters:
* **step**: Time step for each time slot. When a new value is added to the window, it can be stored in a new slot, or use the last one, depending on the time that value was inserted. If *step* is **10**, that means that if a new value is inserted after 10 ms. from the last one, a new slot will be created for this value. Otherwise, the value will be added and grouped to the last slot. **By default, time step is 1000 ms**. High values will prevent the window increasing and consuming memory over time for long windows, but some stats will lose accuracy (such as stdev).
* **timestamp** Defines how time is measured. Can take the following values:
	* **TimeStats.TS.ABSOLUTE** This is the default value. When a value is pushed to the window, it takes the current machine timestamp. In this mode, windows are naturally slided in real-time.
	* **TimeStats.TS.RELATIVE** With this mode, you can push values that has an associated timestamp that is independent of the machine time. Windows are slided based on the max and min inserted timestamps. This mode is less performant, but allows you to insert values out of time order.
* **type**: Value types for this window. Can take the values *"numeric"* or *"category"*. **By default, windows are numeric**.
* **ops**: Statistic operations to perform on the window values. If you don't need all the core functions, or want to add a new custom operation, you can pass an array of operation names. By default, for numeric stats, *ops* are *["count","sum","avg","stdev"]*, and for category *["sum","freq","mode"]*
* **stats**: Object with pre-initialized stats values.

Example:
```javascript
const SWindow = require("swstats");

// Time window of 10 seconds
var tw1 = new SWindow.TimeStats(10000,{
	step:1000,      // Values will be accumulated in slots of 1 second
	type:"numeric", // Numeric values
	ops:["sum"],    // We only want to sum values
	stats : {
		sum : 233     // Initial value where sum will start
	}
});

// Time window of 10 seconds with relative timestamp
var tw2 = new SWindow.TimeStats(10000,{
	timestamp:TimeStats.TS.RELATIVE,
	step:1000,      // Values will be accumulated in slots of 1 second
	type:"numeric" // Numeric values
});
```

### timeWindow.push(val)
Adds a new value to the window. It will consume a new slot or be added to the current one, depending on the *step* value.
If timestamp mode is absolute, simply push the value, but if relative is activated, you must push
an object with value and timestamp:
```javascript
tw1.push(10);
tw2.push({ts:Date.now(),v:10});
```
### timeWindow.push([vals])
Adds multiple values at once, in the same manner as *push(val)*.

### timeWindow.clean()
Resets window and stats.

### timeWindow.pause()
Pauses the window, so no slide occurs, but no new values will be added.

### timeWindow.resume(shift)
Resumes a paused window. If shift is **true**, the timestamps of each slots will be shifted relative to the time the window is resumed, otherwise they keep their original timestamps. This will affect how the window is slided on the next second.

### destroy()
Kill the window, so no new values will be added, and no slide will occur. You can still access to its stats.

### timeWindow.length
Gets the current size of the window (number of slots)

### timeWindow.stats
Gets the current calculated stats
```javascript
{ count: 9,
  sum: 4.638591015963949,
  max: 0.8745422003577794,
  min: 0.04623850021742104,
  avg: 0.5153990017737722,
  stdev:
   { avg: 0.5153990017737722,
     sqsum: 3.044764166996456,
     sum: 4.638591015963949,
     stdev: 0.26957558983867996 } }
```

### timeWindow.window
Gets the current calculated stats per slot
```javascript
[ { t: 1517499437649,
    sum: { David: 571, John: 404 },
    freq: { David: 0.5856410256410256, John: 0.41435897435897434 },
    mode: 'David',
    threshold: { David: false, John: false } },
  { t: 1517499438649,
    sum: { John: 398, David: 580 },
    freq: { John: 0.4069529652351738, David: 0.5930470347648262 },
    mode: 'David',
    threshold: { John: false, David: false } },
  { t: 1517499439649,
    sum: { David: 449, John: 274 },
    freq: { David: 0.6210235131396957, John: 0.3789764868603043 },
    mode: 'David',
    threshold: { David: true, John: false } } ]
```

## Size Window API
### new SWindow.SizeStats(size,[options])
Creates a new size window with *size* slots. The window will slide when the maximum slots have been reached. *options* is optional, and can take the following parameters:
* **type**: "numeric" or "category"
* **ops**: Same a s *TimeStats*.
* **stats**: Object with pre-initialized stats values.

Example:
```javascript
const SWindow = require("swstats");

// Size window of 100 values
vat sw = new SWindow.SizeStats(100,{
	type:"category", // Category values
	ops:["freq"],    // We only want the value frequency
	stats : {
		freq : {       // Initial value where freq will start
			"john" : 0.3,
			"david" : 0.7
		}
	}
});
```

### sizeWindow.push(val)
Adds a new value to the window. It will consume a new slot.

### sizeWindow.push([vals])
Adds multiple values at once. In case of category values, unlike the temporary window, all the values pushed in one call will be added together in the same slot:
```javascript
sizeWindow.push(["value1","value2"]);
```
will consume only one slot, whereas:
```javascript
sizeWindow.push("value1");
sizeWindow.push("value2");
```
will consume two slots.

### sizeWindow.clean()
Resets window and stats.

### sizeWindow.length
Gets the current size of the window (number of slots)

### sizeWindow.stats
Gets the current calculated stats

### timeWindow.window
Gets the current calculated stats per slot

## Custom Statistics API
### SWindow.register(type,name,deps,fn,def)
It is possible to implement and plug a custom function to calculate any stats you need. To register a new stats function, you must call the register function with the following parameters:
* **type**: *"numeric"* or *"category"*
* **name**: Name of the operation
* **deps**: Array of dependencies. If the custom function depends on previous stats to be performed, you can pass the names in this array.
* **fn**: The stats function. It will be described later.
* **default**: If true, new created windows without the *ops* options specified, will perform by default this stats operation.

### The stats function *fn*
**fn(currval,newitems,olditems,allitems,newstats,oldstats)**

The stats function passed to the *register* method takes the following arguments:
* **currval**: The current stats value for your function, prior to the next calculation when an item has been added.
* **newitems**: Array of new values added to the window since the last function call.
* **olditems**: Array of removed items from the window since the last function call.
* **allitems**: Array of all the values that are currently in the window (allitems includes newitems and excludes olditems)
* **newstats**: Current calculated stats by the functions called before this.
* **oldstats**: Previous calculated stats.

The items in the newitems, olditems and allitems arrays, have the following format:
* For numeric values:
```javascript
{
	t : 1496843741554,   // Timestamp in unix format (ms)
	v : 12.34,           // Total value for this slot
	min : 2.4						 // Minimum of the accumulated values
	max : 4.5						 // Maximum of the accumulated values
	l : 4                // Values accumulated in this slot
}
```
* for category values:
```javascript
{
	t : 1496843741554,   // Timestamp in unix format (ms)
	v : {                // Total values for this slot
		"john" : 4,
		"david" : 6
	}
}
```
**Note**: Timestamp only appears in time windows.

Examples:
```javascript
const SWindow = require("swstats");

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
```

Results:
```javascript
{ decsum:
   { ratio: 0.99,
     weight: 0.13397967485796175,
     sum: 10.53536530978331 },
  avg: 7.5,
  stdev: { avg: 7.5, sqsum: 625, sum: 75, stdev: 2.5 },
  variance: 6.25 }
```
