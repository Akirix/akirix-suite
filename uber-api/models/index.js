var fs = require( 'fs' );
var dbconf = require( '../config/config.json' ).databases;
var path = require( 'path' );
var Sequelize = require( 'sequelize' );
var lodash = require( 'lodash' );
var sequelize = new Sequelize(
    dbconf.platform.db,
    dbconf.platform.user,
    dbconf.platform.pass,
    {
        host: dbconf.platform.host,
        port: dbconf.platform.port || 3306,
        define: {
            underscored: true,
            charset: 'utf8',
            collate: 'utf8_general_ci'
        },
        logging: false,
        maxConcurrentQueries: 100,
        pool: { maxConnections: 10, maxIdleTime: 30000 }
    }
);
var db = {};

fs.readdirSync( __dirname )
    .filter( function( file ){
        return ( ( file.indexOf( '.' ) !== 0 ) && ( file !== 'index.js' ) && ( file.slice( -3 ) == '.js' ) );
    } )
    .forEach( function( file ){
        var model = sequelize.import( path.join( __dirname, file ) );
        db[ model.name ] = model;
    } );

Object.keys( db ).forEach( function( modelName ){
    if( db[ modelName ].options.hasOwnProperty( 'associate' ) ){
        db[ modelName ].options.associate( db );
    }
} );

module.exports = lodash.extend( {
    sequelize: sequelize,
    Sequelize: Sequelize
}, db );
