import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model( params ){
        return this.store.find( 'uber-authenticator', params.authenticator_id );
    },

    setupController: function( controller, model ){
        controller.set( 'authenticator', model );
        controller.set( 'isCalling', false );
    },

    renderTemplate: function( controller, model ){
        var template = '';

        if( model.get( 'status' ) === 0 ){
            if( model.get( 'type' ) === 3 ){
                template = 'authenticators/activate-key';
            }
            else if( model.get( 'type' ) === 4 ){
                template = 'authenticators/activate-voice';
            }
            else{
                template = 'authenticators/activate';
            }
        }
        else{
            template = 'authenticators/view-active';
        }

        this.render( template, {
            into: 'authenticators',
            outlet: 'paneSecondary'
        } );
    }
} );