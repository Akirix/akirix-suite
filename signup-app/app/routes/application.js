import Ember from 'ember';
import config from 'signup-app/config/environment';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';
import registrationModel from 'signup-app/models/registration';
import serializer from 'signup-app/utils/serializer';

export default Ember.Route.extend( ApplicationRouteMixin, {
    model: function(){
        if( this.get( 'session.isAuthenticated' ) ){
            return this.get( 'akxAdapter' ).sendRequest( '/users/' + this.get( 'session.user._id' ) + '/registration' ).then( function( result ){
                return Ember.RSVP.resolve( registrationModel.createWithMixins( serializer, result.data.registration ) );
            } );
        }
    },

    setupController: function( controller, model ){
        this._super( controller, model );
        controller.set( 'company', config.APP.company );
        if( this.get( 'session.isAuthenticated' ) ){
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.api_host + '/locations',
                    data: { type: 0 },
                    type: 'GET'
                } ).then( function( res ){
                    Ember.$.ajax( {
                        url: config.APP.api_host + '/locations',
                        data: { type: 1 },
                        type: 'GET'
                    } ).then( function( response ){
                        controller.set( 'countries', res.locations );
                        controller.set( 'states', response.locations );
                    } );
                } );
            } );
            this.transitionTo( model.get( 'nextStep' ) );
        }
        else{
            var lastPart = window.location.href.split( '/' ).pop().split( "?" )[ 0 ];
            var firstPart = window.location.href.split( '/' )[ 3 ];
            if( lastPart !== 'forgot' && lastPart !== 'password-reset' && firstPart !== 'external' && lastPart !== 'sign-up' && lastPart !== 'email-verification' ){
                this.transitionTo( 'login' );
            }
        }
    },

    actions: {
        logout: function(){
            var adapter = this.get( 'akxAdapter' );
            var session = this.get( 'session' );

            this.render( 'loading', {
                into: 'application'
            } );

            adapter.sendRequest( '/logout', 'post', { user_id: session.get( '.user_id' ) } )
                .finally( function(){
                    session.invalidate();
                } );
        },

        loading: function(){
            return true;
        },

        error: function( error, transition ){
            var _this = this;
            if( !Ember.isEmpty( error.jqXHR ) && !Ember.isEmpty( error.jqXHR.status ) ){
                switch( error.jqXHR.status ){
                    case 401:
                        var session = this.get( 'session' );
                        var store = this.get( 'session.store' );
                        transition.abort();
                        store.clear();
                        session.setProperties( {
                            isAuthenticated: false,
                            authenticator: null,
                            content: {}
                        } );
                        return _this.transitionTo( 'index' );
                    default:
                        _this.render( 'error', {
                            into: 'application'
                        } );
                }
            }
            else{
                _this.render( 'error', {
                    into: 'application'
                } );
            }
        },

        sessionAuthenticationSucceeded: function(){
            // Refresh the model to see if there is an active registration
            this.refresh();
        }
    }
} );
