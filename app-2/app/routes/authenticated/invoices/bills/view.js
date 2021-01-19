import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {

    model( params ){
        return Ember.RSVP.hash( {
            invoice: this.store.findRecord( 'invoice', params.invoice_id ),
            invoice_items: this.store.query( 'invoice-item', { invoice_id: params.invoice_id } ),
            documents: this.store.query( 'document', { model: 'invoice', 'model_id': params.invoice_id } ),
            transactions: this.store.query( 'transaction', { model: 'invoice', 'model_id': params.invoice_id } ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        // Project Invoice
        model.invoice.get( 'company' );
        if( model.invoice.get( 'type' ) === 0 ){
            model[ 'project' ] = model.invoice.get( 'project' );
        }
        if( model.invoice.get( 'type' ) !== 2 ){
            model[ 'toCompany' ] = model.invoice.get( 'toCompany' );
            model[ 'fromCompany' ] = model.invoice.get( 'company' );
        }
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        model.invoice.set( 'isMine', false );
        this.send( 'openSidePanel', 'invoices/view', 'invoices/side-panel-view-nav', controller );
    },

    actions: {
        willTransition( transition ){
            if( transition.targetName === `${this.get('routeName')}.index` ){
                this.refresh();
            }
        }
    }
} );
