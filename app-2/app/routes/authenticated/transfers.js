import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Pagination from 'akx-app/mixins/akx-pagination';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, Pagination, CloseMixin, {
    activate(){
        document.title = "Money Transfers";
    },
    model(){
        const controller = this.controllerFor( 'authenticated.transfers' );
        const search = controller.get( 'query' );
        let searchParams = {
            page: controller.get( 'page' ),
            per_page: controller.get( 'perPage' )
        };

        if( !Ember.isEmpty( search ) ){
            searchParams[ 'q' ] = search;
        }
        return this.store.query( 'wire', searchParams );
    },

    renderTemplate(){
        Ember.run.scheduleOnce( 'afterRender', ()=>{
            Ember.$( '[data-toggle="tooltip"]' ).tooltip();
        } );
        this.render( 'transfers/index', {
            into: 'authenticated'
        } );
    },

    actions: {
        refresh(){
            this.refresh();
        },
        
        // willTransition( transition ){
        //     if( transition.targetName === `${this.get('routeName')}.index` ){
        //         this.refresh();
        //     }
        // }
    }
} );
