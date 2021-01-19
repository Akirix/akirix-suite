import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
import akxAdapter from 'signup-app/utils/akx-data';
import EmberValidations from 'ember-validations';
import EmberValidationsMessages from 'ember-validations/messages';
import EmberValidationsErrors from 'ember-validations/errors';

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend( {
    modulePrefix: config.modulePrefix,
    podModulePrefix: config.podModulePrefix,
    Resolver: Resolver
} );

Ember.Controller.reopen( {
    isLocked: false,
    type: 'controller'
} );

Ember.Route.reopen( {
    type: 'route'
} );

Ember.Route.reopen( {
    focusStep: function(){
        var _this = this;
        var routeName = _this.get( 'routeName' );
        var registration = _this.modelFor( 'application' );

        // Scroll to top
        Ember.run.scheduleOnce( 'afterRender', function(){
            Ember.$( document ).scrollTop( 0 );
        } );

        // Set active route
        Ember.run.scheduleOnce( 'sync', function(){
            var currentRoute = registration.appSteps.findBy( 'route', routeName );
            if( !Ember.isEmpty( currentRoute ) ){
                registration.appSteps.setEach( 'active', false );
                Ember.set( currentRoute, 'active', true );
                registration.propertyDidChange( 'appSteps' );
            }
        } );
    },
    enter: function(){
        this._super();
        var _this = this;

        Ember.run.scheduleOnce( 'sync', this, function(){
            var routeName = _this.get( 'routeName' );
            var authenticated = _this.get( 'session.isAuthenticated' );
            var registration = _this.modelFor( 'application' );


            var exemptions = [
                'login',
                'logout',
                'application',
                'loading',
                'password-reset',
                'email-verification',
                'sign-up',
                'forgot'
            ];

            // Routes that should not be redirected
            var authenticatedExemptions = [
                'agreement-print'
            ];

            var verificationExemptions = [
                'verification.index',
                'verification.corporate-documents',
                'verification.primary-id',
                'verification.secondary-id',
                'verification.tax-identity',
                'verification.financial-identity',
                'verification.proof-of-address',
                'verification.w8-ben',
                'verification.w8-ben-e',
                'verification.owner-id'
            ];

            if( exemptions.indexOf( routeName ) === -1 ){

                if( Ember.isEmpty( registration ) ){
                    Ember.Logger.log( 'Redirecting - empty registration' );
                    Ember.Logger.log( registration );
                    window.location = config.APP.signup_app_host + '/login';
                }
                else{

                    var nextStep = registration.get( 'nextStep' );

                    // If the current route is exempted or the current route is the destination
                    if( authenticatedExemptions.indexOf( routeName ) !== -1 ){
                        _this.focusStep();
                    }
                    else if( registration.status !== 0 ){
                        if( routeName === 'complete-final' ){
                            _this.focusStep();
                        }
                        else{
                            _this.transitionTo( 'complete-final' );
                        }
                    }
                    else if( nextStep === routeName ){
                        _this.focusStep();
                    }
                    else{
                        // If the destination is verification and the current route is in the verificationExemptions
                        if( nextStep === 'verification' && verificationExemptions.indexOf( routeName ) !== -1 ){
                            _this.focusStep();
                        }
                        else{
                            Ember.run.once( function(){
                                _this.transitionTo( nextStep );
                            } );
                        }
                    }
                }
            }
        } );
    }
} );

App.initializer( {
    name: 'akx-util',
    initialize: function( container, application ){
        application.register( 'akx-util:akxAdapter', akxAdapter, { singleton: true } );
        application.inject( 'controller', 'akxAdapter', 'akx-util:akxAdapter' );
        application.inject( 'route', 'akxAdapter', 'akx-util:akxAdapter' );
    }
} );


EmberValidations.Mixin.reopen( {
    init: function(){
        this._super();
        this.set( 'validated', false );
    },
    validate: function(){
        var _this = this;
        this.set( 'validated', true );
        return new Ember.RSVP.Promise( function( resolve, reject ){
            _this._super().then( function(){
                _this.set( 'validated', false );
                resolve();
            }, function( errors ){
                _this.scrollToError();
                reject( errors );
            } );
        } );
    },
    scrollToError: function(){
        Ember.run.scheduleOnce( 'afterRender', this, function(){
            var errorElement = Ember.$( '.has-error' ).first();
            if( errorElement.length > 0 ){
                Ember.$( document ).scrollTop( Math.max( 0, errorElement.offset().top - 109 ) );
            }
        } );
    }
} );

EmberValidationsMessages.defaults.blank = 'Cannot be blank';

loadInitializers( App, config.modulePrefix );

export default App;
