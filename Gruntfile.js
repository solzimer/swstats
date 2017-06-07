module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
	  pkg: grunt.file.readJSON('package.json'),
		browserify: {
			dist: {
				watch: true,
				keepAlive: true,
				files: {
					'dist/swstats.js': ['browser.js']
				}
			}
		},
		babel: {
			options: {
				sourceMap: true,
				presets: ['es2015']
			},
			dist: {
				files: {
					'dist/swstats.js': 'dist/swstats.js'
				}
			}
		},
	  uglify: {
	    options: {
	      banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
	    },
			build: {
      	src: 'dist/swstats.js',
      	dest: 'dist/swstats.min.js'
    	}
	  },
		clean: ['dist/swstats.js','swstats.js.map']
	});

	grunt.registerTask('default', ['browserify','babel','uglify']);
};
