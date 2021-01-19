import Ember from 'ember';
import lookupValidator from 'ember-changeset-validations';
import payValidations from 'akx-app/validations/pay-invoice';
import Changeset from 'ember-changeset'
import StringObjectMixin from 'akx-app/mixins/route-locale';
import TwoFactorCheck from 'akx-app/mixins/two-factor-check';
import newAccountValidations from 'akx-app/validations/new-account';

export default Ember.Route.extend( StringObjectMixin, TwoFactorCheck, {
    model( params ){
        return Ember.RSVP.hash( {
            invoice: this.store.findRecord( 'invoice', params.invoice_id ),
            fees: this.store.findAll( 'fee' ),
            accounts: this.store.findAll( 'account' ),
            currencies: this.store.findAll( 'currency' ),
            tickets: this.store.findAll( 'ticket' )
        } );
    },
    afterModel( model ){
        this._super( ...arguments );
        if( !Ember.isEmpty( model.tickets ) ){
            let tickets = model.tickets.filter( ( ticket )=>{
                return ticket.get( 'isNewAccount' ) && ticket.get( 'isOpen' );
            } );
            model[ 'hasRequest' ] = !Ember.isEmpty( tickets );
        }

        if( model.invoice.get( 'isProject') ){
            model[ 'node' ] = model.invoice.get( 'node' );
            model[ 'project' ] = model.invoice.get( 'project' );
        }

        let filter = model.accounts.filter( ( acc )=>{
            return acc.get( 'currency_id' ) === model.invoice.get( 'currency_id' )
        } );

        if( Ember.isEmpty( filter ) ){
            model[ 'newAccount' ] = {
                currency_type: '',
                purpose: '',
                volume_in: '',
                volume_in_frequency: '',
                volume_out: '',
                volume_out_frequency: '',
                average_balance: ''
            }
        }

        model[ 'fee' ] = model.fees.objectAt( 0 );
        return Ember.RSVP.hash( model );
    },
    setupController( controller, model ){
        this._super( ...arguments );
        let accounts = model.accounts.filter( ( acc )=>{
            return acc.get( 'currency_id' ) === model.invoice.get( 'currency_id' )
        } );

        if( Ember.isEmpty( accounts ) ){
            let currencyErrorMessage = controller.get( 'stringList.currencyErrorMessage')

            newAccountValidations.currency_type.push( ( _, newValue )=>{
                return !Ember.isEmpty( model.currencies.findBy( 'id', newValue ) ) ? true : currencyErrorMessage;
            } );

            let changeset = new Changeset(
                model.newAccount,
                lookupValidator( newAccountValidations ),
                newAccountValidations,
                { skipValidate: true }
            );

            controller.set( 'changeset', changeset );
            this.send( 'openSidePanel', 'invoices/no-pay', 'invoices/side-panel-nav', controller );
        }
        else{
            let pojo = { invoice_id: model.invoice.get( 'id' ), amount: 0 };
            let changeset = new Changeset(
                pojo,
                lookupValidator( payValidations ),
                payValidations,
                { skipValidate: true }
            );

            controller.setProperties( {
                accounts: accounts,
                isLocked: false,
                changeset: changeset
            } );
            this.send( 'openSidePanel', 'invoices/pay', 'invoices/side-panel-nav', controller );
        }
    }
} );
