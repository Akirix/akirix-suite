import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, CloseMixin, {
    model(){
        return this.store.findAll( 'wire-template' );
    },

    renderTemplate(){
        this.render( 'transfers/index/wire-templates', {
            into: 'authenticated'
        } );
    }
} );
