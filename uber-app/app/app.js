import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import Cookie from 'simple-auth-cookie-store/stores/cookie';
import Session from 'simple-auth/session';
import AkxUtil from 'uber-app/utils/akx-util';
import config from 'uber-app/config/environment';
import EmberValidations from 'ember-validations';
import EmberValidationsMessages from 'ember-validations/messages';
import DS from 'ember-data';

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend( {
    modulePrefix: config.modulePrefix,
    podModulePrefix: config.podModulePrefix,
    Resolver: Resolver,
    customEvents: {
        paste: "paste"
    }
} );

Ember.Controller.reopen( {
    isLocked: false,
    type: 'controller'
} );

App.initializer( {
    name: 'authentication',
    initialize: function( container, application ){
        Session.reopen( {
            user: function(){
                return JSON.parse( this.get( 'user_data' ) );
            }.property( 'user_data' ),

            company: function(){
                if( !Ember.isEmpty( this.get( 'company_data' ) ) ){
                    return JSON.parse( this.get( 'company_data' ) );
                }
                else{
                    return {};
                }
            }.property( 'company_data' ),

            map: function(){
                var menuMap = {
                    menu: {
                        'application': [
                            {
                                name: '<i class="fa fa-dashboard fa-fw"></i> Dashboard',
                                link: 'dashboard.pending-out',
                                api: ''
                            },
                            {
                                name: '<i class="fa fa-building fa-fw"></i> Companies',
                                link: 'companies.index',
                                api: 'GET /companies'
                            },
                            {
                                name: '<i class="fa fa-child fa-fw"></i> Registration',
                                link: 'registrations.completed',
                                api: 'GET /registrations'
                            },
                            {
                                name: '<i class="fa fa-refresh fa-fw"></i> Transfers',
                                link: 'wires',
                                api: 'GET /wires'
                            },
                            {
                                name: '<i class="fa fa-bar-chart fa-fw"></i> Analytics',
                                link: 'analytics',
                                api: 'GET /analytics'
                            },
                            {
                                name: '<i class="fa fa-bell fa-fw"></i> Announcements',
                                link: 'announcements',
                                api: 'GET /announcements'
                            },
                            {
                                name: '<i class = "fa fa-comment fa fw"></i> Support Tickets',
                                link: 'tickets.pending',
                                api: 'GET /tickets'
                            }
                        ],
                        'companies': [],
                        'registrations': [],
                        'uber-users': [
                            {
                                name: 'Account Settings',
                                link: 'uber-users.view',
                                api: 'GET /uber_users'
                            },
                            {
                                name: 'Authenticators',
                                link: 'authenticators',
                                api: 'GET /uber_authenticators'
                            }
                        ]
                    },
                    actions: {
                        'authenticators': [
                            {
                                name: '<i class="fa fa-shield fa-lg"></i> Add Device',
                                link: 'authenticators.add',
                                api: 'POST /authenticators'
                            }
                        ]
                    }
                };

                if( this.get( 'access_list' ) !== undefined ){


                    return menuMap;
                }
                else{
                    return {};
                }
            }.property( 'access_list' )
        } );
        //container.register( 'authenticator:akx', App.AkxAuthenticator );
        //container.register( 'authorizer:akx', App.AkxAuthorizer );
        //container.register( 'session-store:akx-cookie', App.AkxCookie );
    }
} );

App.initializer( {
    name: 'akx-util',
    initialize: function( container, application ){
        application.register( 'akx-util:akxUtil', AkxUtil, { singleton: true } );
        application.inject( 'route', 'akxUtil', 'akx-util:akxUtil' );
        application.inject( 'controller', 'akxUtil', 'akx-util:akxUtil' );
        application.inject( 'component', 'akxUtil', 'akx-util:akxUtil' );
        application.inject( 'component:slide-task-list', 'applicationController', 'controller:application' );
    }
} );

App.AkxCookie = Cookie.reopen( {
    cookieNamePrefix: 'akx_'
} );

// Make view bind data attributes
Ember.View.reopen( {
    init: function(){
        this._super();
        var self = this;

        // bind attributes beginning with 'data-'
        Ember.keys( this ).forEach( function( key ){
            if( key.substr( 0, 5 ) === 'data-' ){
                self.get( 'attributeBindings' ).pushObject( key );
            }
        } );
    }
} );

Ember.Controller.reopen( {
    init: function(){
        this._super();
        this.isLocked = false;
    }
} );

Ember.Route.reopen( {
    activate: function(){
        this._super();
        this.controllerFor( 'application' ).set( 'show-modal', false );
    },
    type: 'route'
} );

EmberValidationsMessages.defaults.blank = 'Cannot be blank';

EmberValidations.Mixin.reopen( {
    init: function(){
        this._super();
        this.validated = false;
    },
    validate: function(){
        var _this = this;

        this.set( 'validated', true );

        return new Ember.RSVP.Promise( function( resolve, reject ){
            _this._super().then( function(){
                _this.set( 'validated', false );
                resolve();
            }, function( errors ){

                Ember.run.scheduleOnce( 'afterRender', _this, function(){
                    var errorElement = Ember.$( '.has-error' ).first();
                    if( errorElement.length > 0 ){

                        var scrollableElement = errorElement.scrollParent().first();
                        if( scrollableElement.length > 0 ){
                            if( scrollableElement.prop( 'nodeName' ) === '#document' ){
                                scrollableElement.scrollTop( Math.max( 0, errorElement.offset().top - 14 ) );
                            }
                            else{
                                scrollableElement.scrollTop( Math.max( 0, scrollableElement.scrollTop() + errorElement.position().top - 14 ) );
                            }
                        }
                    }
                } );

                reject( errors );
            } );
        } );
    }
} );

DS.RESTSerializer.reopen( {
    normalizeUsingDeclaredMapping: function( type, hash ){
        var attrs = this.get( 'attrs' );
        var payloadKey, key;

        if( attrs ){
            for( key in attrs ){
                payloadKey = this._getMappedKey( key );
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

loadInitializers( App, config.modulePrefix );

export default App;
