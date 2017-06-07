# swstats [![Build Status](https://travis-ci.org/solzimer/swstats.svg?branch=master)](https://travis-ci.org/solzimer/swstats)

Sliding window statistics.

Time and Size sliding windows, capable of calculating incremental statistics, such as count, sum, avg, stdev, freq, etc...

## Features
* Time or size windows (not both)
* Numeric or category stats
* Stats are calculated incrementally, using online algorithms
* Core category stats: sum, frequency, mode
* Code numeric stats: count, sum, avg, stdev
* Plugable custom stats functions
* Time windows are slided each second

## Installation
```
npm install swstats
```

## Quick start
```javascript
const	SWindow = require("swstats");

// Create a time window of 10 secons. Each value pushed to
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
The results will be something like:
```json
{ count: 9,
  sum: 4.383476926850223,
  avg: 0.48705299187224704,
  stdev:
   { avg: 0.48705299187224704,
     sqsum: 2.6772528231211963,
     sum: 4.383476926850223,
     stdev: 0.24546266317028345 } }

....

{ count: 994,
  sum: 495.03542685194975,
  avg: 0.4980235682615189,
  stdev:
   { avg: 0.4980235682615189,
     sqsum: 332.1783737578395,
     sum: 495.03542685194975,
     stdev: 0.29352342336095866 } }
```

## API Time Window
### new SWindow.TimeStats(time,[options])
Creates a new time window of *time* duration. The window will slide on each second.
*options* is optional, and can take the following parameters:
* **step**: Time step for each time slot. When a new value is added to the window, it can be stored in a new slot, or use the last one, depending on the time that value was inserted. If *step* is **10**, that means that if a new value is inserted after 10 ms. from the last one, a new slot will be created for this value. Otherwise, the value will be added and grouped to the last slot. **By default, time step is 1000 ms**. High values will prevent the window increasing and consuming memory over time for long windows, but some stats will lose accuracy (such as stdev).
* **type**: Value types for this window. Can take the values *"numeric"* or *"category"*. **By default, windows are numeric**.
* **ops**: Statistic operations to perform on the window values. If you don't need all the core functions, or want to add a new custom operation, you can pass an array of operation names. By default, for numeric stats, *ops* are *["count","sum","avg","stdev"]*, and for category *["sum","freq","mode"]*

### timeWindow.push(val)
Adds a new value to the window. It will consume a new slot or be added to the current one, depending on the *step* value.

### timeWindow.push([vals])
Adds multiple values at once, in the same manner as *push(val)*.

### timeWindow.clean()
Resets window and stats.

### timeWindow.pause()
Pauses the window, so no slide occurs, but no new values will be added.

### timeWindow.resume(shift)
Resumes a paused window. If shift is **true**, the timestamps of each slots will be shifted relative to the time the window is resumed, otherwise they keep their original timestamps. This will affect how the window is slided on the next second.

### destroy()
Kill the window, so no new values will be added, and no slide will occur. Yoy can still access to its stats.

### timeWindow.length
Gets the current size of the window (number of slots)

### timeWindow.stats
Gets the current calculated stats

## API Size Window
### new SWindow.SizeStats(size,[options])
Creates a new size window with *size* slots. The window will slide when the maximum slots have been reached. *options* is optional, and can take the following parameters:
* **type**: "numeric" or "category"
* **ops**: Same a s *TimeStats*.
