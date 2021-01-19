import Ember from 'ember';

export default Ember.Controller.extend( {
    canAccountTransfer: function(){
        let usdCount = 0;
        let eurCount = 0;
        let gbpCount = 0;

        this.get( 'model' ).forEach( ( account )=>{
            let currency = account.get( 'currency_id' );
            if( currency === 'USD' ){
                usdCount++;
            }
            else if( currency === 'EUR' ){
                eurCount++;
            }
            else {
                gbpCount++
            }
        } );

        return ( usdCount > 1 ) || ( eurCount > 1 ) || ( gbpCount > 1 );
    }.property()
} );