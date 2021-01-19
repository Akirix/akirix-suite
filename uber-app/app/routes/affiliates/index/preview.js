import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'company', params.affiliate_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'commissions', controller.store.find( 'commission', { affiliate_id: model.id } ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'affiliates/index/preview', {
            outlet: 'paneSecondary',
            into: 'affiliates'
        } );
    }
} );
