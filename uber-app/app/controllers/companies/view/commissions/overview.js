import Ember from 'ember';
import config from 'uber-app/config/environment';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );
import _ from 'lodash/lodash';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    commissionData: [ '1', 23, 'fsdf' ],

    dataUpdated: function(){
        var self = this;
        var commissionArray = [];
        self.get( 'model' ).forEach( function( commission ){
            var idx = _.findIndex( commissionArray, { currency_id: commission.get( 'currency.id' ) } );
            if( idx === -1 ){
                commissionArray.push(
                    {
                        currency_id: commission.get( 'currency.id' ),
                        amount: commission.get( 'amount' ),
                        input: null,
                        errors: []
                    }
                );
            }
            else{
                commissionArray[ idx ].amount += commission.get( 'amount' );
                commissionArray[ idx ].rate = commission.get( 'rate' );
            }
        } );
        this.set( 'commissionData', commissionArray );
    }.observes( 'model.@each.currency_id', 'model.@each.amount' ),
} );