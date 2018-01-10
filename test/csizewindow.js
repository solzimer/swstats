const
	SWindow = require("../index"),
	SizeStats = SWindow.SizeStats,
	assert = require('assert');

describe('Category SizeStats', function() {
	var sw = new SizeStats(100,{type:"category"});

	describe('#push(val)', function() {
		it('Should increase window size by 1', function() {
			sw.push("value1");
			assert.equal(1,sw.length);
		});
	});
	describe('#push([vals])', function() {
		it('Should increase window size by 1', function() {
			sw.push(["value1","value2"]);
			assert.equal(2,sw.length);
		});
	});
	describe('#clean()', function() {
		it('Should clean the window and stats', function() {
			sw.clean();
			assert.equal(0,sw.length);
		});
	});
	describe('#stats', function() {
		it('Should have counted correctly the number of each item', function() {
			sw.clean();
			for(let i=0;i<50;i++) {
				sw.push(["value1","value2"]);
				sw.push(["value1","value3"]);
			}
			assert.equal(100,sw.stats.sum.value1);
			assert.equal(50,sw.stats.sum.value2);
			assert.equal(50,sw.stats.sum.value3);
		});
		it('Should have calculated correctly the frequency of each item', function() {
			assert.equal(0.5,sw.stats.freq.value1);
			assert.equal(0.25,sw.stats.freq.value2);
			assert.equal(0.25,sw.stats.freq.value3);
		});
		it('Should have calculated correctly the mode of the items', function() {
			assert.equal("value1",sw.stats.mode);
		});
	});
	describe('[slide]', function() {
		it('Should slide the window if push more items than max size', function() {
			sw.clean();
			for(let i=0;i<200;i++) {
				sw.push(["value1","value2"]);
			}
			assert.equal(100,sw.length);
		});
	});
	describe('[slide] #stats', function() {
		it('Should count correctly on slided window', function() {
			sw.clean();
			for(let i=0;i<50;i++) sw.push(["value1","value2"]);
			for(let i=0;i<60;i++) sw.push(["value3","value4"]);

			assert.equal(40,sw.stats.sum.value1);
			assert.equal(40,sw.stats.sum.value2);
			assert.equal(60,sw.stats.sum.value3);
			assert.equal(60,sw.stats.sum.value4);
		});
		it('Should get the frequency correctly on slided window', function() {
			assert.equal(0.2,sw.stats.freq.value1);
			assert.equal(0.2,sw.stats.freq.value2);
			assert.equal(0.3,sw.stats.freq.value3);
			assert.equal(0.3,sw.stats.freq.value4);
		});
		it('Should get the mode correctly on slided window', function() {
			assert.equal("value4",sw.stats.mode);
		});
	});
});
