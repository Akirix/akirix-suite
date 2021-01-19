import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'institution-user', params.institution_user_id );
    },

    afterModel: function(){
        document.title = this.modelFor( 'companies.view.institution-users.view' ).get( 'str_long_name' );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/institution-users/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } )
    }
} );