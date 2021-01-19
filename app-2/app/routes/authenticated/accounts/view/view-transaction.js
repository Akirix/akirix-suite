import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    templateName: 'accounts/view-transaction',
    model( params ){
        let results = {
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        };
        let transaction = this.store.peekRecord( 'transaction', params.transaction_id );
        results[ 'transaction' ] = transaction;
        let model = transaction.get( 'model' );
        let model_id = transaction.get( 'model_id' );
        if( !Ember.isEmpty( model ) && !Ember.isEmpty( model_id ) ){
            return this.store.findRecord( model, model_id ).then( ( transactionModel )=>{
                results[ model ] = transactionModel;
                switch( model ){
                    case 'invoice':
                        // Invoice Items
                        results[ 'invoice_items' ] = transactionModel.get( 'invoice_items' );
                        // Documents
                        results[ 'documents' ] = this.store.query( 'document', {
                            model: 'invoice',
                            model_id: transactionModel.get( 'id' )
                        } );
                        results[ 'transactions' ] = this.store.query( 'transaction', {
                            model: 'invoice',
                            model_id: transactionModel.id
                        } );
                        // Project Invoice
                        if( transactionModel.get( 'type' ) === 0 ){
                            // Nodes
                            results[ 'project' ] = transactionModel.get( 'project' );
                        }
                        // One time on platform and project
                        if( transactionModel.get( 'type' ) !== 2 ){
                            results[ 'toCompany' ] = transactionModel.get( 'company' );
                            results[ 'fromCompany' ] = transactionModel.get( 'toCompany' );
                            results[ 'invoice_transactions' ] = this.store.query( 'transaction', {
                                model: 'invoice',
                                model_id: transactionModel.id
                            } );
                        }
                        this.set( 'templateName', 'accounts/view-invoice' );
                        break;
                    case 'wire':
                        if( transactionModel.get( 'type' ) === 0 ){
                            this.set( 'templateName', 'accounts/view-withdrawal' );
                            results[ 'toAccount' ] = transactionModel.get( 'account' );
                        }
                        if( transactionModel.get( 'type' ) === 1 ){
                            this.set( 'templateName', 'accounts/view-deposit' );
                            results[ 'toAccount' ] = transactionModel.get( 'account' );
                        }
                        if( transactionModel.get( 'type' ) === 2 ){
                            this.set( 'templateName', 'accounts/view-book-transfer' );
                            results[ 'documents' ] = this.store.query( 'document', {
                                model: 'wire',
                                model_id: transactionModel.id
                            } );
                            results[ 'company' ] = transactionModel.get( 'company' );
                        }
                        break;
                    case 'charge':
                        this.set( 'templateName', 'accounts/view-charge' );
                        break;
                    case 'fx-request':
                        this.set( 'templateName', 'accounts/view-fx' );
                        results[ 'fromAccount' ] = this.store.findRecord( 'account', transactionModel.get( 'from_account_id' ) );
                        if( transactionModel.get( 'to_account_id' ) ){
                            results[ 'toAccount' ] = this.store.findRecord( 'account', transactionModel.get( 'to_account_id' ) );
                        }
                        break;
                }
                return Ember.RSVP.hash( results );
            } );
        }
        else{
            this.set( 'templateName', 'accounts/view-account-transfer' );
            results[ 'fromAccount' ] = this.store.findRecord( 'account', transaction.get( 'from_account_id' ) );
            results[ 'toAccount' ] = this.store.findRecord( 'account', transaction.get( 'to_account_id' ) );
            return Ember.RSVP.hash( results );
        }
    },

    afterModel( model ){
        this._super( ...arguments );
        if( model.transaction.get( 'model' ) === 'wire' && model.wire.get( 'type' ) === 2 ){
            if( model.wire.get( 'company.id' ) === this.get( 'session.data.authenticated.company.id' ) ){
                model.wire.set( 'isMine', true );
                model[ 'account' ] = model.wire.get( 'account' );
            }
            else{
                model.wire.set( 'isMine', false );
                model[ 'account' ] = this.store.findRecord( 'account', model.transaction.get( 'to_account_id' ) );
            }
        }
    },

    setupController( controller ){
        this._super( ...arguments );
        this.send( 'openSidePanel', this.get( 'templateName' ), '', controller );
        controller.set( 'locale', this.get( 'localeFile' ).locale );
    }
} );
