import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import _ from 'lodash/lodash';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return Ember.RSVP.hash( {
            account: this.store.find( 'account', this.modelFor( 'companies.view.accounts.view' ).get( 'id' ) ),
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'account', model.account );
    },

    renderTemplate: function(){
        this.render( 'companies/accounts/edit', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


