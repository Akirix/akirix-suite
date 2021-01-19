import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    account: null,

    validations: {
        'data.account_id': {
            presence: true
        },
        'data.to_account_id': {
            presence: true
        },
        'data.amount': {
            presence: true,
            numericality: {
                greaterThan: 0,
                lessThanOrEqualTo: 'account.balance'
            }
        }
    },

    targetAccounts: function(){
        var self = this;
        this.set( 'data.to_account_id', null );
        return this.get( 'accounts' ).filter( function( item, index, enumerable ){
            return ( item.get( 'currency_id' ) === self.get( 'account.currency_id' ) ) && (item.get( 'id' ) !== self.get( 'account.id' ) );
        } );
    }.property( 'account.currency_id' ),


    actions: {
        createAccountTransfer: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var account_id = self.get( 'data.account_id' );
                    var payload = {
                        amount: self.get( 'data.amount' ),
                        to_account_id: self.get( 'data.to_account_id' )
                    };
                    self.set( 'isLocked', true );
                    Ember.run( function(){
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/accounts/' + account_id + '/transfer',
                            type: 'POST',
                            contentType: "application/json; charset=utf-8",
                            dataType: 'json',
                            data: JSON.stringify( { data: payload } )
                        } ).then(
                            function( response ){
                                var route = self.container.lookup( 'route:companies.view.accounts' );
                                self.notify.success( 'The account transaction sent successfully.', { closeAfter: 5000 } );
                                route.refresh();
                                self.transitionToRoute( 'companies.view.accounts' );
                            },
                            function( xhr ){
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                            } );
                    } );
                },
                function(){
                }
            );
        }
    }

} );
