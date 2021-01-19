import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model(){
        return this.store.findAll( 'account' );
    },

    renderTemplate(){
        this.render( 'transfers/index/wire-instructions', {
            into: 'authenticated'
        } );
    }
} );
