import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-batch', params.wire_batch_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'wire-batches/view', {
            into: 'wire-batches',
            outlet: 'paneSecondary'
        } );
    }


} );


