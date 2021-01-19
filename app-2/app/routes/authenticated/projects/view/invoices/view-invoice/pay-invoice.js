import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import twoFactorCheck from 'akx-app/mixins/two-factor-check';
import lookupValidator from 'ember-changeset-validations';
import { validateNumber, validatePresence } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, twoFactorCheck, {
    model( params ){
        return Ember.RSVP.hash( {
            project: this.modelFor( 'authenticated.projects.view' ).project,
            invoice: this.store.findRecord( 'invoice', params.invoice_id ),
            transaction: this.store.query( 'transaction', { model: 'invoice', model_id: params.invoice_id } ),
            fees: this.store.findAll( 'fee' ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },
    afterModel( model ){
        this._super( ...arguments );
        model[ 'node' ] = model.invoice.get( 'node' );
        model[ 'account' ] = model.project.get( 'node.account' );
        model[ 'fee' ] = model.fees.objectAt( 0 );
        return Ember.RSVP.hash( model );
    },
    setupController( controller, model ){
        this._super( ...arguments );
        let stringList = controller.get( 'stringList' );
        let validations = {
            amount: [ validateNumber( { gt: 0, positive: true, allowBlank: false } ) ],
            invoice_id: validatePresence( true )
        };

        if( model.invoice.get( 'isProject' ) ){
            let totalPointsAndBalance = Number( model.node.get( 'points_available' ) ) + model.account.get( 'balance' );
            validations.amount.push( function( _, newValue ){
                return newValue > totalPointsAndBalance ? stringList.pointsErrorMessage : true;
            } );
        }
        else if( model.invoice.get( 'type' ) === 1 ){
            validations.amount.push( function( _, newValue ){
                return newValue > model.account.get( 'balance' ) ? stringList.amountErrorMessage : true;
            } );
        }

        
        let changeset = new Changeset(
            { invoice_id: model.invoice.id, amount: 0.00, account_id: model.node.get( 'account_id' ) },
            lookupValidator( validations ),
            validations
        );
        controller.setProperties( {
            success: false,
            changeset: changeset,
        } );
        model.invoice.set( 'transactions', model.transactions );
        this.send(
            'openSidePanel',
            'projects/view/pay-invoice',
            'projects/view/side-navs/pay-invoice',
            controller
        );
    }
} );
