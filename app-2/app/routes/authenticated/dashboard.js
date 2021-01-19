import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, CloseMixin, {
    activate(){
        document.title = "Dashboard";
    },

    model(){
        return this.store.findAll( 'account' );
    },

    renderTemplate(){
        this.render( 'dashboard/index' );
    }
} );
