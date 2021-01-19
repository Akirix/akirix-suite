import Ember from 'ember';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );


export default Ember.Component.extend( {
    tagName: 'div',
    layoutName: 'analytics-cop',

    renderComponent: function(){
        var self = this;
        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/analytics/cop',
                type: 'GET'
            } ).then(
                function( response ){
                    if( response.data !== null ){
                        var symbols = [];
                        for( var i = 0; i < response.data.length; i++ ){
                            symbols.push( response.data[ i ].currency_id );
                        }
                        self.set( 'dataSeries', response.data );

                        //var payload = {
                        //    method: 'GET',
                        //    url: 'http://api.fixer.io/latest?base=USD&symbols=' + symbols.join( ',' )
                        //};

                        //Ember.$.ajax( {
                        //    url: config.APP.uber_api_host + '/proxies',
                        //    type: 'POST',
                        //    contentType: "application/json; charset=utf-8",
                        //    dataType: 'json',
                        //    data: JSON.stringify( payload )
                        //} ).then(
                        //    function( data ){
                        //        var rateRes = JSON.parse( data );
                        //        var usdValue = 0;
                        //
                        //        for( var i = 0; i < response.data.length; i++ ){
                        //            if( response.data[ i ].currency_id === 'USD' ){
                        //                usdValue += response.data[ i ].platform_balance;
                        //                response.data[ i ].rate = 1.0000;
                        //                response.data[ i ].usd_value = response.data[ i ].platform_balance;
                        //            }
                        //            else{
                        //                response.data[ i ].usd_value = response.data[ i ].platform_balance / rateRes.rates[ response.data[ i ].currency_id ];
                        //                usdValue += response.data[i].usd_value;
                        //                response.data[ i ].rate = rateRes.rates[ response.data[i].currency_id ];
                        //            }
                        //        }
                        //
                        //        self.set( 'dataSeries', response.data );
                        //        self.set( 'usdValue', usdValue );
                        //    },
                        //    function( xhr, status, error ){
                        //    }
                        //);
                    }
                },
                function( xhr, status, error ){
                }
            );
        } );

    },

    didInsertElement: function(){
        this.renderComponent();
    }
} );