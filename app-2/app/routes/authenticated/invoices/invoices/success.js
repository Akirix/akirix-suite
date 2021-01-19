import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    queryParams: {
        invoice_id: { refreshModel: true }
    },

    model( params ){
        return Ember.RSVP.hash( {
            invoice: this.store.findRecord( 'invoice', params.invoice_id ),
            invoice_items: this.store.query( 'invoice-item', { invoice_id: params.invoice_id } ),
            documents: this.store.query( 'document', { model: 'invoice', model_id: params.invoice_id } ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
            fromCompany: this.get( 'session.data.authenticated.company' )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        if( model.invoice.get( 'type' ) !== 2 ){
            model[ 'toCompany' ] = model.invoice.get( 'toCompany' );
        }
        else{
            model[ 'toCompany' ] = {
                name: model.invoice.get( 'to_company_name' ),
                address: model.invoice.get( 'to_company_address' ),
                city: model.invoice.get( 'to_company_city' ),
                postal_code: model.invoice.get( 'to_company_postal_code' )
            }
        }
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let message = model.invoice.get( 'status' ) === 0 ? 'invoiceSaved' : 'invoiceSent';
        controller.set( 'message', controller.get( `stringList.${message}` ) );
    },

    renderTemplate(){
        this.render( 'invoices/success', {
            into: 'authenticated'
        } );
    }
} );
