import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    queryParams: {
        wire_template_id: { refreshModel: true }
    },

    model( params ){
        return Ember.RSVP.hash( {
            wireTemplate: this.store.findRecord( 'wire-template', params.wire_template_id ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'company' ] = model.wireTemplate.get( 'company' );
        return Ember.RSVP.hash( model );
    },

    renderTemplate(){
        this.render( 'partials/success', {
            into: 'authenticated'
        } );
    }
} );
