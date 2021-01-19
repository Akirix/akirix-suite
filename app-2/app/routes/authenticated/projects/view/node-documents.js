import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            node: this.store.findRecord( 'node', params.node_id ),
            documents: this.store.query( 'document', { model: 'node', 'model_id': params.node_id } )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        // Have to do this in order to be able to push new documents into array.
        model[ 'docs' ] = model.documents.toArray();
        return Ember.RSVP.hash( model );
    },

    renderTemplate( controller ){
        this.send( 'openSidePanel', 'projects/view/node-documents', '', controller, true );
    }
} );
