import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( ApplicationRouteMixin.reopen( {
    model: function(){
        return null;
    },

    setupController: function( controller, model ){
        var self = this;
        if( this.get( 'session.isAuthenticated' ) ){
            this.getItemCounts();

        }

        controller.set( 'countries', this.store.find( 'location', { type: 0 } ) );
        controller.set( 'states', this.store.find( 'location', { type: 1 } ) );

        if( !Ember.isEmpty( controller.get( 'session.access_token' ) ) ){
            controller.get( 'socket' ).disconnect();
            controller.get( 'socket' ).io.opts.query = "token=" + controller.get( 'session.access_token' );
            controller.get( 'socket' ).connect();

            controller.get( 'socket' ).on( 'command', function( data ){
                controller.store.fetch( data.model, data.model_id );
            } );

            controller.get( 'socket' ).on( 'event', function( event ){
                switch( event.name ){
                    case 'two_factor_authenticated':
                        self.send( 'closePane' );
                        break;
                }
            } );

            this.store.find( 'uber-user-cache', controller.get( 'session.user.id' ) ).then( function( cache ){
                controller.set( 'userCache', cache );
            } );
        }
    },

    activate: function(){
        document.title = "Akirix Über";

        // Transition to login page except login and password-reset
        if( !this.get( 'session.isAuthenticated' ) ){
            var lastPart = window.location.href.split( '/' ).pop().split( "?" )[ 0 ];
            if( lastPart !== 'forgot' && lastPart !== 'password-reset' ){
                this.transitionTo( 'login' );
            }
        }
    },

    getItemCounts: function(){
        this.controllerFor( 'application' ).updateItemCounts();
        Ember.run.later( this, function(){
            this.getItemCounts();
        }, 60000 );
    },

    actions: {
        showTwoFactorOverlay: function(){
            this.render( 'authenticators/authenticate', {
                into: 'application',
                outlet: 'overpane'
            } );

            Ember.run.scheduleOnce( 'afterRender', function(){
                Ember.$( '#overpane' ).removeClass( 'hide fadeOutDownBig' ).addClass( 'fadeInUpBig' );
            } );
        },

        checkTwoFactorAuthenticated: function(){
            var self = this;
            var applicationController = this.controllerFor( 'application' );
            applicationController.isTwoFactorAuthenticated().then( function( result ){
                if( !result ){
                    self.send( 'showTwoFactorOverlay' );
                }
            } );
        },
        showRateLimitOverlay: function(){
            this.render( 'views/rate-limit', {
                into: 'application',
                outlet: 'overpane'
            } );

            Ember.run.scheduleOnce( 'afterRender', function(){
                Ember.$( '#overpane' ).removeClass( 'hide fadeOutDownBig' ).addClass( 'fadeInUpBig' );
            } );
        },
        showDupCheckOverlay: function(){
            this.render( 'dup-check', {
                into: 'application',
                outlet: 'overpane'
            } );

            Ember.run.scheduleOnce( 'afterRender', function(){
                Ember.$( '#overpane' ).removeClass( 'hide fadeOutDownBig' ).addClass( 'fadeInUpBig' );
            } );
        },
        showPasswordExpired: function(){
            this.render( 'update-password', {
                into: 'application',
                outlet: 'overpane'
            } );

            Ember.run.scheduleOnce( 'afterRender', function(){
                Ember.$( '#overpane' ).removeClass( 'hide fadeOutDownBig' ).addClass( 'fadeInUpBig' );
            } );
        },
        closePane: function(){
            Ember.$( '#overpane' ).removeClass( 'fadeInUpBig' ).addClass( 'fadeOutDownBig' );
            Ember.$( '.modal-backdrop.in' ).remove();
            //this.set( 'code', null );
            //this.set( 'errors.code', null );
        },

        closeLimitOverlay: function(){
            this.send( 'closePane' );
            this.get( 'controller' ).transitionToRoute( 'login' );
        },

        sessionAuthenticationSucceeded: function(){
            this.getItemCounts();
            this.transitionTo( 'dashboard' );
            this.store.find( 'uber-user-cache', this.get( 'session.user.id' ) ).then( function( cache ){
                this.controllerFor( 'application' ).set( 'userCache', cache );
            }.bind( this ) );
        },

        openModal: function( options ){
            var self = this;

            var applicationController = self.controllerFor( 'application' );

            var modalName;

            if( typeof options === 'string' ){
                modalName = options;
            }
            else{
                modalName = options.template;
            }

            var renderOptions = {
                into: 'application',
                outlet: 'modal'
            };

            if( options.hasOwnProperty( 'controller' ) ){
                renderOptions[ 'controller' ] = options.controller;
            }

            applicationController.set( 'show-modal', true );
            this.render( modalName, renderOptions );
        },

        closeModal: function(){
            var self = this;
            var applicationController = self.controllerFor( 'application' );
            applicationController.set( 'show-modal', false );
            return this.disconnectOutlet( {
                parentView: 'application',
                outlet: 'modal'
            } );
        },

        error: function( error, transition ){
            var self = this;
            if( error.hasOwnProperty( 'jqXHR' ) ){
                self.get( 'akxUtil' ).handleError( error.jqXHR, {
                    scope: self
                } );
            }
            else{
                self.get( 'akxUtil' ).handleError( error, {
                    scope: self
                } );
            }
            return true;
        },

        goBack: function(){
            this.send( 'closePane' );
            var parentRoute = this.get( 'container' ).lookup( 'controller:application' ).currentPath;
            if( parentRoute.substring( parentRoute.lastIndexOf( '.' ) ) === '.index' ){
                parentRoute = parentRoute.substring( 0, parentRoute.lastIndexOf( '.' ) );
            }
            parentRoute = parentRoute.substring( 0, parentRoute.lastIndexOf( '.' ) );
            this.transitionTo( parentRoute );
        },

        recordHistory: function( historyType, itemId ){
            var theCache = this.controllerFor( 'application' ).get( 'userCache' );
            if( !Ember.isEmpty( theCache ) ){
                theCache.addHistory( historyType, itemId );
                theCache.save();
            }
        }
    }
} ) );
