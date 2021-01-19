
import Ember from 'ember';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import AkxUtil from 'akx-app/utils/akx-util';
import DS from 'ember-data';

let locale = 'en-US';
let localeFile = require( `akx-app/locales/${ locale }` );

const App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

let access = {
    dashboard: {
        endpoint: 'GET /announcements',
        route: 'authenticated.dashboard',
        id: 'dashboard',
        icon: '<i class="akx-icon akx-dashboard"></i>'
    },
    accounts: {
        endpoint: 'GET /accounts',
        route: 'authenticated.accounts',
        id: 'accounts',
        icon: '<i class="akx-icon akx-accounts"></i>'
    },
    transfers: {
        endpoint: 'GET /wires',
        route: 'authenticated.transfers',
        id: 'transfers',
        icon: '<i class="akx-icon akx-money-transfer"></i>',
        subRoutes: [
          {
            route: 'authenticated.transfers',
            id: 'recentTransfers',
            icon: '<i class="akx-icon akx-money-transfer"></i>',
          },
          {
            route: 'authenticated.transfers.wire-templates',
            id: 'templates',
            icon: '<i class="akx-icon akx-templates"></i>',
          },
          {
            route: 'authenticated.transfers.wire-instructions',
            id: 'wireInstructions',
            icon: '<i class="akx-icon akx-wire-instructions"></i>',
          }
        ]
    },
    projects: {
      endpoint: 'GET /projects',
      route: 'authenticated.projects',
      id: 'projects',
      icon: '<i class="akx-icon akx-projects"></i>'
    },
    invoices: {
      endpoint: 'GET /invoices',
      route: 'authenticated.invoices',
      id: 'invoices',
      icon: '<i class="akx-icon akx-invoices"></i>',
      subRoutes: [
        {
          route: 'authenticated.invoices.invoices',
          id: 'recentInvoices',
          icon: '<i class="akx-icon akx-invoices"></i>',
        },
        {
          route: 'authenticated.invoices.bills',
          id: 'recentBills',
          icon: '<i class="akx-icon akx-invoices"></i>',
        }
      ]
    },
    tickets: {
      endpoint: 'GET /tickets',
      route: 'authenticated.tickets',
      id: 'tickets',
      icon: '<i class="akx-icon akx-requests"></i>'
    }
}

App.initializer( {
  name: 'akx-util',
  initialize: function( application ){
      application.register( 'akx-util:akxUtil', AkxUtil, { singleton: true } );
      application.inject( 'controller', 'akxUtil', 'akx-util:akxUtil' );
      application.inject( 'route', 'akxUtil', 'akx-util:akxUtil' );
      application.inject( 'component', 'akxUtil', 'akx-util:akxUtil' );
  }
} );

App.initializer( {
	name: 'locale-file',
	initialize: function( application ){
		application.register( 'locale:routes', localeFile.default.routes, { instantiate: false } );
		application.register( 'locale:components', localeFile.default.components, { instantiate: false } );
		application.register( 'locale:models', localeFile.default.models, { instantiate: false } );
		application.inject( 'route', 'localeFile', 'locale:routes' );
		application.inject( 'component', 'localeFile', 'locale:components' );
		application.inject( 'model', 'localeFile', 'locale:models' );
	}
} );

App.initializer( {
	name: 'access-list',
	initialize: function( application ){
		application.register( 'access:list', access, { instantiate: false } );
		application.inject( 'component:left-nav', 'accessList', 'access:list' );
	}
} );

Ember.LinkComponent.reopen( {
	session: Ember.inject.service( 'session' ),
	leftNavLinks: access,

	canShow: function(){
		let accessList = this.get( 'session.data.authenticated.access' );
		if( this.get( 'leftNavLinks' )[ this.get('title') ] ){
			let leftNavAcl = this.get( 'leftNavLinks' )[ this.get('title') ];
			this.set( 'isVisible', accessList[ leftNavAcl.endpoint ] );
		}

		if( this.get( 'title' ) === 'company' ){
			this.set( 'isVisible', accessList[ 'GET /companies/:company_id' ] );
		}
	}.on( 'init' )
} );

DS.RESTAdapter.reopen( {
  normalizeErrorResponse( status, headers, payload ){
      if (payload && payload.errors && payload.errors.length > 0 ) {
          return [ {
              status: status,
              errors: payload.errors.join( "\n" )
          } ];
      }
      else {
          return [
              {
                  status: `${status}`,
                  title: "The backend responded with an error",
                  detail: `${payload}`
              }
          ];
      }
  }
} );

DS.RESTSerializer.reopen( {
  normalizeUsingDeclaredMapping: function( type, hash ){
      var attrs = this.get( 'attrs' );
      var payloadKey, key;

      if( attrs ){
          for( key in attrs ){
              payloadKey = this._getMappedKey( key, type );
              if( !hash.hasOwnProperty( payloadKey ) ){
                  continue;
              }

              if( payloadKey !== key ){
                  hash[ key ] = hash[ payloadKey ];
                  //delete hash[payloadKey];
              }
          }
      }
  }
} );

loadInitializers(App, config.modulePrefix);

export default App;
