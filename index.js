const
	Operation = require("./lib/ops"),
	TimeStats = require("./lib/timestats"),
	SizeStats = require("./lib/sizestats");

module.exports = {
	TimeStats : TimeStats,
	SizeStats : SizeStats,
	Operation : Operation,
	register : Operation.register
};
