/* global require, module */

var EmberApp = require( 'ember-cli/lib/broccoli/ember-app' );

var app = new EmberApp( {
    sourcemaps: {
        enabled: false
    },
    'babel': {
        optional: [ 'es7.decorators' ]
    },

    'ember-cli-mocha': {
        useLintTree: false
    },
    storeConfigInMeta: false
} );
var config = require( './config/environment' );

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.
app.import( 'bower_components/bootstrap/dist/css/bootstrap.min.css' );
app.import( 'bower_components/pikaday/css/pikaday.css' );
app.import( 'bower_components/intl-tel-input/build/css/intlTelInput.css' );
app.import( 'bower_components/hint.css/hint.min.css' );
app.import( 'bower_components/jquery-file-upload/css/jquery.fileupload.css' );
app.import( 'bower_components/jasny-bootstrap/dist/css/jasny-bootstrap.min.css' );

app.import( 'bower_components/showdown/dist/showdown.js' );
app.import( 'bower_components/ember/ember-template-compiler.js' );
app.import( 'bower_components/bootstrap/dist/js/bootstrap.min.js' );
app.import( 'bower_components/jquery-ui/jquery-ui.js' );
app.import( 'bower_components/intl-tel-input/build/js/intlTelInput.min.js' );
app.import( 'bower_components/intl-tel-input/lib/libphonenumber/build/utils.js' );
app.import( 'bower_components/moment/moment.js' );
app.import( 'bower_components/pikaday/pikaday.js' );
app.import( 'bower_components/globalize/lib/globalize.js' );
app.import( 'bower_components/globalize/lib/cultures/globalize.cultures.js' );
app.import( 'bower_components/jquery-file-upload/js/jquery.fileupload.js' );
app.import( 'bower_components/jquery-file-upload/js/jquery.iframe-transport.js' );
app.import( 'bower_components/jquery-file-upload/js/jquery.fileupload-process.js' );
app.import( 'bower_components/mathjs/dist/math.min.js' );
app.import( 'bower_components/highcharts-release/highcharts.js' );
app.import( 'bower_components/js-marker-clusterer/src/markerclusterer.js' );
app.import( 'bower_components/socket.io-client/socket.io.js' );

app.import( 'bower_components/d3/d3.js' );

for( var i = 0; i < config().css.length; i++ ){
    app.import( config().css[ i ] );
}

module.exports = app.toTree();
