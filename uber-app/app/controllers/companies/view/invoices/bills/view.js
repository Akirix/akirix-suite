import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    availableBalance: function(){
        if( this.get( 'invoice.type' ) === 0 ){
            return this.get( 'invoice.node.points_available' );
        }
        else if( this.get( 'invoice.type' ) === 1 ){
            return this.get( 'account.balance' );
        }
    }.property( 'invoice.node.points_available', 'account.balance' ),

    validations: {
        account_id: {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'invoice.type' ) === 1 ){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            }
        },
        payment_amount: {
            presence: true,
            numericality: {
                greaterThan: 0,
                lessThanOrEqualTo: 'availableBalance'
            }
        }
    },

    amount_paid: function(){
        var amountPaid = 0;
        if( this.get( 'invoice_transactions' ) !== undefined ){
            this.get( 'invoice_transactions' ).forEach( function( item ){
                if( item.get( 'type' ) !== 3 ){
                    amountPaid += item.get( 'amount' );
                }
            } );
        }
        return amountPaid;
    }.property( 'invoice_transactions.@each.amount', 'invoice_transactions.@each.type' ),

    amount_fee: function(){
        var amountFee = 0;
        if( this.get( 'invoice_transactions' ) !== undefined ){
            this.get( 'invoice_transactions' ).forEach( function( item ){
                if( item.get( 'type' ) === 3 ){
                    amountFee += item.get( 'amount' );
                }
            } );
        }
        return amountFee;
    }.property( 'invoice_transactions.@each.amount', 'invoice_transactions.@each.type' ),

    amount_remain: function(){
        return Number( this.get( 'invoice.total' ) ) - Number( this.get( 'amount_paid' ) );
    }.property( 'amount_paid', 'invoice.total' ),

    str_amount_paid: function(){
        return locale.format( Number( this.get( 'amount_paid' ) ), 'n2' );
    }.property( 'amount_paid' ),

    str_amount_remain: function(){
        return locale.format( Number( this.get( 'amount_remain' ) ), 'n2' );
    }.property( 'amount_remain' ),

    str_amount_fee: function(){
        return locale.format( Number( this.get( 'amount_fee' ) ), 'n2' );
    }.property( 'amount_fee' ),

    actions: {


        //getPdf: function(){
        //    window.open( this.get( 'invoice.url_pdf' ) + '?token=' + this.get( 'session.access_token' ), '_self' );
        //}
    }
} );

