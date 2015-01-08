'use strict';

var Seq 	= require('sequelize');
var path 	= require('path');
var fs 		= require('fs');
var util 	= require('util');


var plugin = module.exports = function sequelize(viper) {

	var that = this;


	// walk through each config item
	// attribute key of config will be name of connection
	// and available in plugins interface
	Object.keys(this.config).forEach(function(key) {

		// config args
		var args = that.config[key];

		// create connection
		var con = that.interface[key] = new Seq(args.database, args.username, args.password, args.options || {});

		// connect to database
		con.authenticate().then(function() {
			that.log(('Connection ('+key+') has been established successfully.').cyan);
		}, function(err) {
			that.logError(err);
		});


		// Scan path/s for models and attach them to connection
		if(args.modelsDir) {
			if( util.isArray(args.modelsDir) ) {
				args.modelsDir.forEach(function(dir) {
					dir = path.resolve( viper.cwd(), dir );
					scanDirForModels(con, dir);
				});
			} else {
				var dir = path.resolve( viper.cwd(), args.modelsDir );
				scanDirForModels(con, dir);
			}
		}

	});

};


plugin.priority = 100;



/**
 * require each item in directory as model definition to connection
 * @param  {db-connection} con [description]
 * @param  {string} dir [path to directory which contains model-files]
 */
function scanDirForModels(con, dir) {

	if(dir) {
		if( fs.existsSync( dir ) ) {
			fs.readdirSync(dir).forEach(function(item) {
				con['import']( path.join( dir, item ));
			});
		}
	}

}
