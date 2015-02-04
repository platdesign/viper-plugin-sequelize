'use strict';

var Sequelize 	= require('sequelize');
var fs 			= require('fs');
var path 		= require('path');

module.exports = function() {
	var that = this;

	if( this._config.sequelize ) {

		var config = this._config.sequelize;

		// Walk config and create connection-provider for each item
		Object.keys(config).forEach(function(serviceName) {

			// config args
			var args = config[serviceName];


			// Create provider for connection
			that.provider(serviceName, function() {
				// create connection
				var con = new Sequelize(args.database, args.username, args.password, args.options || {});

				// connect to database
				var conPromise = con.authenticate().then(function() {
					console.log(('Connection ('+serviceName+') has been established successfully.').cyan);
					return con;
				}, function(err) {
					// Output error
					console.log(('Connection ('+serviceName+') failed. '+err.message).red);
				});



				// return service function which returns connection-object
				return function() {
					return conPromise;
				};
			});

			that.config([serviceName, function(con){

				that.logVerbose('Import models (' + serviceName + ')');

				// Import models from modelPath
				var modelsPath = path.resolve( that.cwd(), args.modelsPath || './models');

				if( fs.existsSync(modelsPath) ) {
					fs.readdirSync(modelsPath).forEach(function(item) {
						var itemPath = path.join(modelsPath, item);
						con.import(itemPath);
					});
				}

			}]);

			that.config([serviceName, function(con) {

				that.logVerbose('Associate models (' + serviceName + ')');

				// walk through all models and call associate if this method exists
				Object.keys(con.models).forEach(function(modelName) {
					var model = con.model(modelName);
					if(model.associate) {
						model.associate();
					}
				});

				// after association sync the database
				if(args.sync) {
					that.logVerbose('Sync database ' + serviceName);
					return con.sync(args.sync).then(function() {
						that.logVerbose('Database synced (' + serviceName + ')');
					});
				}
			}]);

		});

	}

};
