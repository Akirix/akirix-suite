import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';
import templateValidations from 'akx-app/validations/wire-templates'

export default Ember.Route.extend( StringObjectMixin, {
    //type 0: account transfer
    //type 1: book transfer
    //type 2: bank transfer
    queryParams: {
        wire_id: { refreshModel: true },
        from_account_id: { refreshModel: true },
        to_account_id: { refreshModel: true },
        amount: { refreshModel: true },
        template_id: { refreshModel: true },
        wire_type: { refreshModel: true }
    },

    model( params ){
        if( params.wire_type === '0' ){
            return Ember.RSVP.hash( {
                fromAccount: this.store.findRecord( 'account', params.from_account_id ),
                toAccount: this.store.findRecord( 'account', params.to_account_id ),
                amount: params.amount,
                type: params.wire_type
            } );
        }
        let obj = {
            wire: this.store.findRecord( 'wire', params.wire_id ),
            account: this.store.findRecord( 'account', params.from_account_id ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
            type: params.wire_type
        }
        
        if( params.template_id !== 'no-template' && params.wire_type === '2' ){
            obj[ 'template' ] = this.store.findRecord( 'wire-template', params.template_id );
        }
        return Ember.RSVP.hash( obj );
    },

    afterModel( model ){
        this._super( ...arguments );
        if( model.type !== '0' ){
            return Ember.RSVP.Promise.resolve( model.wire.get( 'company' ) );
        }
    },

    setupController( controller, model ){
        this._super( ...arguments );
        if( model.type === '0' ){
            controller.set( 'template', 'transfers/index/account-transfer/account-transfer-success' );
            controller.set( 'successMessage', controller.get( 'stringList.accountTransferMsg' ) );
        }
        else if( model.type === '1' ){
            controller.set( 'template', 'transfers/index/book-transfer/book-transfer-success' );
            controller.set( 'successMessage', controller.get( 'stringList.bookTransferMsg' ) );
        }
        else{
            if( !Ember.isEmpty( model.template ) ){
                let changeset = new Changeset(
                    model.template,
                    lookupValidator( templateValidations ),
                    templateValidations, { skipValidate: true }
                );
                controller.set( 'changeset', changeset );
            }
            controller.set( 'template', 'transfers/index/bank-transfer/bank-transfer-success' );
            controller.set( 'successMessage', controller.get( 'stringList.bankTransferMsg' ) );
        }
    },

    renderTemplate( controller ){
        this.render( controller.get( 'template' ), {
            into: 'authenticated'
        } );
    }
} );
