import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
var locale = new Globalize( navigator.language );

export default Ember.ArrayController.extend( {
    paneSecondary: null,
    needs: [ 'application' ],

    incomingTotal: function(){
        var total = 0;
        this.get( 'incomingWires' ).forEach( function( wire ){
            total += wire.get( 'amount' );
        } );
        return locale.format( total, 'n2' );
    }.property( 'incomingWires.@each.amount' ),

    actions: {}
} );
