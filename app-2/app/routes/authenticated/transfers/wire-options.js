import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import twoFactorCheck from 'akx-app/mixins/two-factor-check';

export default Ember.Route.extend( StringObjectMixin, DirtyCheck, twoFactorCheck, {
    model(){
        return this.store.findAll( 'account' );
    },

    renderTemplate(){
        this.render( 'transfers/index/type-selection', {
            into: 'authenticated'
        } );
    }
} );
