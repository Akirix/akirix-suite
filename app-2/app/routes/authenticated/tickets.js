import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, CloseMixin, {
    activate(){
        document.title = "Tickets";
    },
    model(){
        return this.store.findAll( 'ticket' );
    },

    renderTemplate(){
        Ember.run.scheduleOnce( 'afterRender', ()=>{
            Ember.$( '[data-toggle="tooltip"]' ).tooltip();
        } );
        this.render( 'tickets/index', {
            into: 'authenticated'
        } );
    },

    actions: {
        search(){
            this.refresh();
        }
    }
} );
