import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-batch', params.wire_batch_id );
    },

    renderTemplate: function( controller, model ){
        var templatePath = 'dashboard/wire-summary/view-batch';
        this.render( templatePath, {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }

} );


