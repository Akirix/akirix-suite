import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.get( 'akxUtil' )._sendRequest( '/signupRegistrations/' + params.registration_id, 'get' ).then( function( result ){
            return signupModel.create( result.data.registration );
        } );
    },

    setupController: function( controller, model ){
        controller.set('exceptions', this.store.find('uber-exception', { model: 'registration', model_id: model._id } ) );
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations/preview', {
            outlet: 'paneSecondary',
            into: 'registrations'
        } );
    }
} );
