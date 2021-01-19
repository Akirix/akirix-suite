import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Pagination from 'akx-app/mixins/akx-pagination';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, Pagination, AuthenticatedRouteMixin, CloseMixin, {
    activate(){
        document.title = "Bills";
    },
    model(){
        let controller = this.controllerFor( 'authenticated.invoices.bills' );
        let searchParams = {
            page: controller.get( 'page' ),
            per_page: controller.get( 'perPage' ),
            to_company_id: this.get( 'session.data.authenticated.company.id' )
        };
        return this.store.query( 'invoice', searchParams );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let pendingInvoices = Ember.A();
        let draftInvoices = Ember.A();
        let partialInvoices = Ember.A();
        let paidInvoices = Ember.A();

        model.forEach( ( invoice )=>{
            if( invoice.get( 'isPending' ) ){
                pendingInvoices.pushObject( invoice );
            }
            else if( invoice.get( 'isPartiallyPaid' ) ){
                partialInvoices.pushObject( invoice );
            }
            else if( invoice.get( 'isDraft' ) ){
                draftInvoices.pushObject( invoice );
            }
            else{
                paidInvoices.pushObject( invoice );
            }
        } );

        controller.setProperties( {
            allInvoices: pendingInvoices.concat( partialInvoices, paidInvoices ),
            draftInvoices: draftInvoices,
            linkView: 'authenticated.invoices.bills.view',
            isEmpty: Ember.isEmpty( model ),
            isMine: false
        } );
    },

    renderTemplate(){
        Ember.run.scheduleOnce( 'afterRender', ()=>{
            Ember.$( '[data-toggle="tooltip"]' ).tooltip();
        } );
        this.render( 'invoices/invoices-bills', {
            into: 'authenticated'
        } );
    },

    actions: {
        refresh(){
            this.refresh();
        }
    }
} );
