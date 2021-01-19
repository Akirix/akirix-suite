import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Pagination from 'akx-app/mixins/akx-pagination';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, Pagination, CloseMixin, {
    model( params ){
        let controller = this.controllerFor( 'authenticated.accounts.view' );
        let search = controller.get( 'query' );
        let searchParams = {
            page: controller.get( 'page' ),
            per_page: controller.get( 'perPage' ),
            account_id: params.account_id
        };
        if( !Ember.isEmpty( search ) ){
            searchParams[ 'q' ] = search;
        }
        return Ember.RSVP.hash( {
            transactions: this.store.query( 'transaction', searchParams ),
            account: this.store.findRecord( 'account', params.account_id )
        } );
    },

    renderTemplate(){
        this.render( 'accounts/view', {
            into: 'authenticated'
        } );
    },

    actions: {
        refresh(){
            this.refresh();
        }
    }
} );
