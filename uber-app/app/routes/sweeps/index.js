import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( {
    model: function( params ){
        return Ember.$.ajax( config.APP.uber_api_host + '/accounts/getSweepConfig' );
    },

    setupController: function( controller, model ){
        Ember.get( model, 'sweepConfig' ).forEach( function( currencyType ){
            var promises = Ember.A();
            currencyType.fee_accounts.forEach( function( feeAcct ){
                promises.push( controller.store.find( 'Account', feeAcct ) );
            } );
            Ember.RSVP.Promise.all( promises ).then( function( fromAccounts ){
                fromAccounts.forEach( function( feeAcct ){
                    Ember.set( feeAcct, 'isChecked', true );
                } );
                Ember.set( currencyType, 'fromAccounts', fromAccounts );
            } );
            controller.store.find( 'Account', currencyType.to_account ).then( function( toAccount ){
                Ember.set( currencyType, 'toAccount', toAccount );
            } );

        } );
        controller.set( 'model', model.sweepConfig );
    },

    renderTemplate: function(){
        this.render( 'sweeps/index', {
            into: 'sweeps',
            outlet: 'panePrimary'
        } );
    },
} );
