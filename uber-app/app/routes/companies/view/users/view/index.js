import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    renderTemplate: function( controller, model ){
        this.render( 'companies/users/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );