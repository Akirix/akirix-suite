import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import invoiceValidations from 'akx-app/validations/invoice';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            invoice: this.store.findRecord( 'invoice', params.invoice_id ),
            invoice_items: this.store.query( 'invoice-item', { invoice_id: params.invoice_id } ),
            documents: this.store.query( 'document', { model: 'invoice', 'model_id': params.invoice_id } ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
            fromCompany: this.get( 'session.data.authenticated.company' ),
            project: this.modelFor( 'authenticated.projects.view' ).project
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        if( model.invoice.get( 'type' ) !== 2 ){
            model[ 'toCompany' ] = model.invoice.get( 'toCompany' );
        }
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let changeset = new Changeset( model.invoice, lookupValidator( invoiceValidations ), invoiceValidations );
        if( model.invoice.get( 'type' ) === 2 ){
            model[ 'toCompany' ] = {
                name: model.invoice.get( 'to_company_name' ),
                address: model.invoice.get( 'to_company_address' ),
                city: model.invoice.get( 'to_company_city' ),
                state_province: model.invoice.get( 'to_company_state_province' ),
                postal_code: model.invoice.get( 'to_company_postal_code' ),
                phone: model.invoice.get( 'to_company_phone' ),
                email: model.invoice.get( 'to_company_email' ),
                country: model.invoice.get( 'to_company_country' )
            };
        }
        else {
            changeset.set( 'account_number', model.toCompany.get( 'account_number' ) );
        }

        changeset.set( 'documents', model.documents.toArray() );
        changeset.set( 'invoiceItems', model.invoice_items.toArray() );
        
        controller.setProperties( {
            isLocked: false,
            changeset: changeset
        } );
        this.send( 'openSidePanel', 'invoices/edit', 'projects/view/side-navs/edit-invoice', controller );
    },

    actions: {
        willTransition( transition ){
            let controller = this.controllerFor( this.get( 'routeName' ) );
            let changeset = controller.get( 'changeset' );
            let documents = changeset.get( 'documents' );
            
            changeset.rollback();
            if( controller.get( 'model.documents.length' ) < documents.length ){
                transition.abort();

                let promises = Ember.A();
                documents.splice( ( controller.get( 'model.documents.length' ) - 1 ) );
                documents.forEach( ( document )=>{
                    promises.push( document.destroyRecord() );
                } );
                Ember.RSVP.Promise.all( promises ).then( ()=>{
                    this.transitionToRoute( 'authenticated.invoices.invoices' );
                } );
            }
            return true;
        }
    }
} );
