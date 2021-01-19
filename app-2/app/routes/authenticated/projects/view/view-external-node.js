import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {

    model( params ){
        return Ember.RSVP.hash( {
            externalNode: this.store.findRecord( 'external-node', params.external_node_id ),
            project: this.modelFor( 'authenticated.projects.view' ).project
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'wireInstructions' ] = this.store.query( 'wire-instruction', {
            model: 'node', model_id: model.project.get( 'node.id' )
        } );
    },

    setupController( controller ){
        this._super( ...arguments );
        this.send( 'openSidePanel', 'projects/view/view-external-node', '', controller, true );
    }
} );
