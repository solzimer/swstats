"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
			}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];return s(n ? n : e);
			}, l, l.exports, e, t, n, r);
		}return n[o].exports;
	}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
		s(r[o]);
	}return s;
})({ 1: [function (require, module, exports) {
		"use strict";

		(function ($) {
			var SWindow = require("./main.js");
			$.SWindow = SWindow;
		})(window);
	}, { "./main.js": 3 }], 2: [function (require, module, exports) {
		module.exports = {
			sum: function sum(currval, newitems, olditems, allitems, newstats, oldstats) {
				currval = currval === undefined ? {} : currval;
				var ln = newitems.length,
				    lo = olditems.length;
				for (var i = 0; i < ln; i++) {
					for (var j in newitems[i].v) {
						currval[j] = currval[j] || 0;
						currval[j] += newitems[i].v[j];
					}
				}
				for (var _i = 0; _i < lo; _i++) {
					for (var _j in olditems[_i].v) {
						currval[_j] = currval[_j] || 0;
						currval[_j] -= olditems[_i].v[_j];
					}
				}
				return currval;
			},
			freq: function freq(currval, newitems, olditems, allitems, newstats, oldstats) {
				var sums = newstats.sum;
				var total = 0,
				    res = {};
				for (var i in sums) {
					total += sums[i];
				}for (var _i2 in sums) {
					res[_i2] = sums[_i2] / total;
				}return res;
			},
			mode: function mode(currval, newitems, olditems, allitems, newstats, oldstats) {
				var sums = newstats.sum;
				var map = [];
				for (var i in sums) {
					map.push({ k: i, t: sums[i] });
				}map.sort(function (a, b) {
					return a.t - b.t;
				});
				return (map.pop() || {}).k;
			}
		};
	}, {}], 3: [function (require, module, exports) {
		var NOps = require("./nops.js");
		var COps = require("./cops.js");

		var IVAL = 1000; // Slide window interval
		var LIST = []; // Active window instances

		// Stats function type constants
		var TYPES = {
			numeric: "numeric",
			category: "category"
		};

		// Default operations
		var DEF_OPS = {
			numeric: ["count", "sum", "max", "min", "avg", "stdev"],
			category: ["sum", "freq", "mode"]
		};

		// Default options
		var DEF_OPTIONS = {
			type: TYPES.numeric,
			ops: DEF_OPS.numeric,
			step: 1000
		};

		// Registered operations
		var OPS = {
			numeric: {
				"count": { fn: NOps.count, deps: [] },
				"sum": { fn: NOps.sum, deps: [] },
				"max": { fn: NOps.max, deps: [] },
				"min": { fn: NOps.min, deps: [] },
				"avg": { fn: NOps.avg, deps: [] },
				"stdev": { fn: NOps.stdev, deps: ["avg"] }
			},
			category: {
				"sum": { fn: COps.sum, deps: [] },
				"freq": { fn: COps.freq, deps: ["sum"] },
				"mode": { fn: COps.mode, deps: ["sum"] }
			}
		};

		/**
   * Simple object clone function
   */
		function clone(obj) {
			if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) != "object") {
				return obj;
			} else {
				var o = {};
				for (var i in obj) {
					o[i] = clone(obj[i]);
				}return o;
			}
		}

		/**
   * Registers a new operation
   * @param type [TYPES.numeric / TYPES.category]
   * @param name The name of the stat function
   * @param deps Array of dependency names
   * @param fn Stats function to be called, in the form of
   * fn(currval,newitems,olditems,allitems,newstats,oldstats)
   * @param def Use by default.
   */
		function register(type, name, deps, fn, def) {
			OPS[type][name] = { fn: fn, deps: deps };
			if (def) DEF_OPS[type].push(name);
		}

		function depends(a, b, type) {
			var deps = OPS[type][a].deps;
			if (!deps.length) return false;else if (deps.indexOf(b) >= 0) return true;else {
				return deps.reduce(function (curr, val) {
					return curr || depends(val, b, type);
				}, false);
			}
		}

		/**
   * Sorts category operations by its dependencies
   */
		function sortOps(ops, type) {
			var map = {},
			    n = false;

			ops.forEach(function (op) {
				return map[op] = true;
			});
			do {
				n = false;
				ops.forEach(function (op) {
					OPS[type][op].deps.forEach(function (dep) {
						if (!map[dep]) {
							map[dep] = true;
							ops.push(dep);
							n = true;
						};
					});
				});
			} while (n);

			// Stupid sort because Array.sort will not work with dependency sorting
			if (ops.length > 1) {
				var tmp = null,
				    it = false;
				do {
					it = false;
					for (var i = 0; i < ops.length; i++) {
						for (var j = i; j < ops.length; j++) {
							if (depends(ops[i], ops[j], type)) {
								tmp = ops[i];
								ops[i] = ops[j];
								ops[j] = tmp;
								it = true;
							}
						}
					}
				} while (it);
			}
		}

		/**
   * Slide time window interval
   */
		setInterval(function () {
			var now = Date.now();

			// For each stat created object
			LIST.filter(function (sws) {
				return !sws._pause;
			}).forEach(function (sws) {
				var arr = sws._arr,
				    time = sws._time;
				var type = sws._type;
				var old = [];
				var oldstats = clone(sws.stats);

				// Remove slots whose date has expired
				while (arr.length && now - arr[0].t > time) {
					old.push(arr.shift());
				} // Execute each stat operation over the remaining slots
				sws._ops.forEach(function (op) {
					sws.stats[op] = OPS[type][op].fn(sws.stats[op], [], old, sws._arr, sws.stats, oldstats);
				});
			});
		}, IVAL);

		/**
   * TimeStats Slide Window
   * @param time Time (ms) of the duration of the window, before slide
   * @param options Object
   */

		var TimeStats = function () {
			function TimeStats(time, options) {
				_classCallCheck(this, TimeStats);

				options = options || DEF_OPTIONS;
				this._options = options;
				this._arr = [];
				this._time = time || 10000;
				this._type = options.type || DEF_OPTIONS.type;
				this._ops = options.ops || DEF_OPS[this._type];
				this._step = options.step || DEF_OPTIONS.step;
				this._pause = false;
				this._active = true;
				this._oldstats = {};
				this.stats = clone(options.stats || {});

				sortOps(this._ops, this._type);
				LIST.push(this);
			}

			_createClass(TimeStats, [{
				key: "clean",
				value: function clean() {
					this._arr = [];
					this._oldstats = {};
					this.stats = clone(this._options.stats || {});
				}
			}, {
				key: "push",
				value: function push(vals) {
					if (!this._active || this._pause) return;

					vals = vals instanceof Array ? vals : [vals];

					return this._type == TYPES.numeric ? this._pushNum(vals) : this._pushCat(vals);
				}
			}, {
				key: "pause",
				value: function pause() {
					this._pause = true;
				}
			}, {
				key: "resume",
				value: function resume(shift) {
					var arr = this._arr;
					if (shift && arr.length) {
						var now = Date.now();
						var last = arr[arr.length].t;
						var diff = now - last;
						arr.length.forEach(function (v) {
							return v.t += diff;
						});
					}
					this._pause = false;
				}
			}, {
				key: "destroy",
				value: function destroy() {
					var idx = LIST.indexOf(this);
					LIST.splice(idx, 1);
					this._active = false;
				}
			}, {
				key: "_pushNum",
				value: function _pushNum(vals) {
					var _this = this;

					var now = Date.now();
					var arr = this._arr;
					var type = this._type;
					var oldstats = clone(this.stats);

					vals = vals.map(function (v) {
						return { t: now, v: v, l: 1, max: v, min: v };
					});

					if (!arr.length) arr.push({ t: now, v: 0, l: 0, max: -Infinity, min: Infinity });
					var last = clone(arr[arr.length - 1]);

					if (now - last.t < this._step) {
						vals.forEach(function (v) {
							last.v += v.v;last.l += 1;
							last.max = Math.max(last.max, v.v), last.min = Math.min(last.min, v.v);
						});
						var oa = [arr.pop()],
						    na = [last];
						arr.push(last);
						this._ops.forEach(function (op) {
							_this.stats[op] = OPS[type][op].fn(_this.stats[op], na, oa, arr, _this.stats, oldstats);
						});
					} else {
						vals.forEach(function (v) {
							arr.push(v);
						});
						this._ops.forEach(function (op) {
							_this.stats[op] = OPS[type][op].fn(_this.stats[op], vals, [], arr, _this.stats, oldstats);
						});
					}

					return this;
				}
			}, {
				key: "_pushCat",
				value: function _pushCat(vals) {
					var _this2 = this;

					var now = Date.now();
					var arr = this._arr;
					var type = this._type;
					var oldstats = clone(this.stats);
					var map = {};

					vals.forEach(function (v) {
						map[v] = map[v] || 0;
						map[v]++;
					});

					if (!arr.length) arr.push({ t: now, v: {} });
					var last = clone(arr[arr.length - 1]);

					if (now - last.t < this._step) {
						for (var i in map) {
							last.v[i] = last.v[i] || 0;
							last.v[i] += map[i];
						}
						var oa = [arr.pop()],
						    na = [last];
						arr.push(last);
						this._ops.forEach(function (op) {
							_this2.stats[op] = OPS[type][op].fn(_this2.stats[op], na, oa, arr, _this2.stats, oldstats);
						});
					} else {
						var item = { t: now, v: map };
						arr.push(item);
						this._ops.forEach(function (op) {
							_this2.stats[op] = OPS[type][op].fn(_this2.stats[op], [item], [], arr, _this2.stats, oldstats);
						});
					}

					return this;
				}
			}, {
				key: "toJSON",
				value: function toJSON() {
					return this.stats;
				}
			}, {
				key: "length",
				get: function get() {
					return this._arr.length;
				}
			}, {
				key: "window",
				get: function get() {
					var _this3 = this;

					var type = this._type;
					var win = this._arr.map(function (slot) {
						var ops = {};
						_this3._ops.forEach(function (op) {
							ops[op] = OPS[type][op].fn(undefined, [slot], [], [slot], ops, {});
						});
						return ops;
					});
					return win;
				}
			}]);

			return TimeStats;
		}();

		/**
   * SizeStats Slide Window
   * @param size Number of maximum slots before slide
   * @param options Object
   */


		var SizeStats = function () {
			function SizeStats(size, options) {
				_classCallCheck(this, SizeStats);

				options = options || DEF_OPTIONS;

				this._options = options;
				this._arr = [];
				this._size = size || 1000;
				this._type = options.type || DEF_OPTIONS.type;
				this._ops = options.ops || DEF_OPS[this._type];
				this.stats = clone(options.stats || {});

				sortOps(this._ops, this._type);
			}

			_createClass(SizeStats, [{
				key: "clean",
				value: function clean() {
					this._arr = [];
					this._oldstats = {};
					this.stats = clone(this._options.stats || {});
				}
			}, {
				key: "push",
				value: function push(vals) {
					vals = vals instanceof Array ? vals : [vals];

					return this._type == TYPES.numeric ? this._pushNum(vals) : this._pushCat(vals);
				}
			}, {
				key: "_pushNum",
				value: function _pushNum(vals) {
					var _this4 = this;

					var arr = this._arr,
					    old = [];
					var type = this._type;
					var oldstats = clone(this.stats);

					vals = vals.map(function (v) {
						return { v: v, l: 1, max: v, min: v };
					});
					vals.forEach(function (v) {
						return _this4._arr.push(v);
					});

					while (this._arr.length > this._size) {
						old.push(this._arr.shift());
					}

					this._ops.forEach(function (op) {
						_this4.stats[op] = OPS[type][op].fn(_this4.stats[op], vals, old, arr, _this4.stats, oldstats);
					});

					return this;
				}
			}, {
				key: "_pushCat",
				value: function _pushCat(vals) {
					var _this5 = this;

					var arr = this._arr,
					    old = [];
					var type = this._type;
					var oldstats = clone(this.stats);
					var map = { v: {} };

					vals.forEach(function (v) {
						map.v[v] = map.v[v] || 0;
						map.v[v]++;
					});
					this._arr.push(map);

					while (this._arr.length > this._size) {
						old.push(this._arr.shift());
					}

					this._ops.forEach(function (op) {
						_this5.stats[op] = OPS[type][op].fn(_this5.stats[op], [map], old, arr, _this5.stats, oldstats);
					});

					return this;
				}
			}, {
				key: "toJSON",
				value: function toJSON() {
					return this.stats;
				}
			}, {
				key: "length",
				get: function get() {
					return this._arr.length;
				}
			}, {
				key: "window",
				get: function get() {
					var _this6 = this;

					var type = this._type;
					var win = this._arr.map(function (slot) {
						var ops = {};
						_this6._ops.forEach(function (op) {
							ops[op] = OPS[type][op].fn(undefined, [slot], [], [slot], ops, {});
						});
						return ops;
					});
					return win;
				}
			}]);

			return SizeStats;
		}();

		module.exports = {
			TimeStats: TimeStats,
			SizeStats: SizeStats,
			register: register
		};
	}, { "./cops.js": 2, "./nops.js": 4 }], 4: [function (require, module, exports) {
		var OPS = {
			count: function count(currval, newitems, olditems, allitems, newstats, oldstats) {
				var t = 0,
				    len = allitems.length;
				for (var i = 0; i < len; i++) {
					t += allitems[i].l || 1;
				}return t;
			},
			sum: function sum(currval, newitems, olditems, allitems, newstats, oldstats) {
				currval = currval === undefined ? 0 : currval;
				var ln = newitems.length,
				    lo = olditems.length;
				for (var i = 0; i < ln; i++) {
					currval += newitems[i].v;
				}for (var _i3 = 0; _i3 < lo; _i3++) {
					currval -= olditems[_i3].v;
				}return currval;
			},
			max: function max(currval, newitems, olditems, allitems, newstats, oldstats) {
				var max = -Infinity,
				    len = allitems.length;
				for (var i = 0; i < len; i++) {
					max = Math.max(max, allitems[i].max);
				}return max;
			},
			min: function min(currval, newitems, olditems, allitems, newstats, oldstats) {
				var min = Infinity,
				    len = allitems.length;
				for (var i = 0; i < len; i++) {
					min = Math.min(min, allitems[i].min);
				}return min;
			},
			avg: function avg(currval, newitems, olditems, allitems, newstats, oldstats) {
				var ln = OPS.count(0, 0, 0, newitems),
				    lo = OPS.count(0, 0, 0, olditems),
				    nvl = OPS.count(0, 0, 0, allitems),
				    ovl = nvl - ln + lo;

				currval = currval === undefined ? 0 : currval;
				currval = currval * ovl;

				for (var i = 0; i < newitems.length; i++) {
					currval += newitems[i].v;
				}for (var _i4 = 0; _i4 < olditems.length; _i4++) {
					currval -= olditems[_i4].v;
				}currval = currval / nvl;
				return isNaN(currval) ? 0 : currval;
			},
			stdev: function stdev(currval, newitems, olditems, allitems, newstats, oldstats) {
				oldstats.stdev = oldstats.stdev || { avg: 1, sqsum: 0, sum: 0, stdev: 0 };

				var ln = OPS.count(0, 0, 0, newitems),
				    lo = OPS.count(0, 0, 0, olditems),
				    nvl = OPS.count(0, 0, 0, allitems),
				    ovl = nvl - ln + lo,
				    len = allitems.length,
				    oavg = oldstats.avg || 0;

				var oldavg = oldstats.stdev.avg;
				var oldsqsum = oldstats.stdev.sqsum;
				var oldsum = oldstats.stdev.sum;
				var newavg = newstats.avg || 0;
				var newsqsum = oldsqsum;
				var newsum = oldsum;

				for (var i = 0; i < olditems.length; i++) {
					var it = olditems[i].v / (olditems[i].l || 1);
					newsqsum -= it * it;
					newsum -= it;
				}

				for (var _i5 = 0; _i5 < newitems.length; _i5++) {
					var _it = newitems[_i5].v / (newitems[_i5].l || 1);
					newsqsum += _it * _it;
					newsum += _it;
				}

				var stdev = Math.sqrt((newsqsum - 2 * newavg * newsum + len * newavg * newavg) / len);
				return {
					avg: newavg,
					sqsum: newsqsum,
					sum: newsum,
					stdev: stdev
				};
			}
		};

		module.exports = OPS;
	}, {}] }, {}, [1]);
//# sourceMappingURL=swstats.js.map
