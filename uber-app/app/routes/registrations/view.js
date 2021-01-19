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
        controller.set( 'model', model );
        if( !Ember.isEmpty( model.get( 'institution_id' ) ) ){
            controller.store.find( 'company', model.get( 'institution_id' ) ).then( function( company ){
                model.set( 'institution', company );
            } )
        }
        this.get( 'akxUtil' )._sendRequest( '/signupRegistrations/' + model._id + '/validation', 'get' ).then( function( result ){
            controller.set( 'validationErrors', result.data.validationErrors );
        } );
    },

    afterModel: function( model ){
        model.appSteps.forEach( function( item, key ){
            var appRoute = 'registrations.view.' + item.route;
            Ember.set( item, 'appRoute', appRoute );
            Ember.set( item, 'complete', item.status === 1 );
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.view', {
            outlet: 'panePrimary'
        } );

        this.render( 'registrations/admin', {
            outlet: 'paneSecondary'
        } );
    },
    actions: {
        reloadRegistrationModel: function(){
            return this.refresh();
        }
    }
} );

