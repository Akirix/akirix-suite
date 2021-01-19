/* eslint-env node */
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let emberOptions = {
    'ember-cli-password-strength': {
      bundleZxcvbn: false
    },
    'sourcemaps': {
      // enabled: EmberApp.env() !== 'production',
      enabled: EmberApp.env() !== 'production',
      extensions: ['js']
    },
    outputPaths: {
      app: {
        css: {
          'app': '/assets/akx-app.css',
          'dark': '/assets/dark.css'
        }
      }
    }
  };
  let app = new EmberApp(defaults, emberOptions);

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
  app.import( 'vendor/core/popper.min.js' );
  app.import( 'vendor/core/bootstrap-material-design.min.js' );
  app.import( 'vendor/plugins/moment.min.js' );
  app.import( 'vendor/plugins/bootstrap-datetimepicker.js' );
  app.import( 'vendor/plugins/nouislider.min.js' );
  app.import( 'vendor/plugins/bootstrap-tagsinput.js' );
  app.import( 'vendor/plugins/bootstrap-selectpicker.js' );
  app.import( 'vendor/plugins/jasny-bootstrap.min.js' );
  app.import( 'vendor/plugins/material-kit.js?v=2.1.0' );
  app.import( 'node_modules/showdown/dist/showdown.js' );
  
  app.import( 'node_modules/highcharts/js/highcharts.js' );
  app.import( 'node_modules/highcharts/css/highcharts.css' );
  return app.toTree();
};
