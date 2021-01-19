import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return this.store.query( 'statement', { account_id: params.account_id } );
    },

    renderTemplate( controller ){
        this.send( 'openSidePanel', 'accounts/statements', '', controller );
    }
} );
