/* global require, module */

var EmberApp = require( 'ember-cli/lib/broccoli/ember-app' );
var app = new EmberApp( {} );
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
// please specify an object with thbower install jquery-uie list of modules as keys
// along with the exports of each module as its value.

app.import( 'bower_components/bootstrap/dist/css/bootstrap.min.css' );
app.import( 'bower_components/qtip2/jquery.qtip.min.css' );
app.import( 'bower_components/intl-tel-input/build/css/intlTelInput.css' );
app.import( 'bower_components/animate.css/animate.min.css' );

app.import( 'bower_components/ember/ember-template-compiler.js' );
app.import( 'bower_components/jquery-ui/ui/widget.js' );
app.import( 'bower_components/qtip2/jquery.qtip.min.js' );
app.import( 'bower_components/moment/moment.js' );
app.import( 'bower_components/blueimp-file-upload/js/jquery.fileupload.js' );
app.import( 'bower_components/blueimp-file-upload/js/jquery.fileupload-process.js' );
app.import( 'bower_components/intl-tel-input/build/js/intlTelInput.min.js' );
app.import( 'bower_components/intl-tel-input/lib/libphonenumber/build/utils.js' );

for( var i = 0; i < config().css.length; i++ ){
    app.import( config().css[ i ] );
}

module.exports = app.toTree();
