var _ = require( 'lodash' );
var fs = require( 'fs' );
var mongoose = require( 'mongoose' );
var moment = require( 'moment-timezone' );
var dbconf = require( '../config/config.json' ).databases.signup;

// DB & Model

// Setup DB
var mongodbConnection = 'mongodb://' + dbconf.hosts.join() + '/' + dbconf.database;
var db = mongoose.connect( mongodbConnection, dbconf.options );

var models_path = __dirname;
var walk = function( path ){
    fs.readdirSync( path ).forEach( function( file ){
        var newPath = path + '/' + file;
        var stat = fs.statSync( newPath );
        if( stat.isFile() ){
            if( /(.*)\.(js$|coffee$)/.test( file ) && ( file !== 'index.js' ) ){
                require( newPath );
            }
        } else if( stat.isDirectory() ){
            walk( newPath );
        }
    } );
};
walk( models_path );

module.exports = db;
