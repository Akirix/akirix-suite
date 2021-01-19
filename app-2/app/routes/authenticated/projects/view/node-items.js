import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            project: this.modelFor( 'authenticated.projects.view').project,
            node: this.store.findRecord( 'node', params.node_id )
        } );
    },
    renderTemplate( controller ){
        this.send( 'openSidePanel', 'projects/view/node-items', '', controller, true );
    }
} );
