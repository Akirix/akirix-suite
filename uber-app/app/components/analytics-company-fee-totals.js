import Ember from 'ember';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );


export default Ember.Component.extend( {
    tagName: 'div',
    layoutName: 'analytics-fee-totals',
    from_date: null,
    to_date: null,

    invoiceWireRatio: function(){
        if( !this.get( 'dataSeries' ) ){
            return '0.00%';
        }
        else{
            if( this.get('dataSeries.0.invoices_of_bills_amount' ) === 0 ){
                return '0.00%';
            }
            if( this.get('dataSeries.0.wires_in_amount' ) === 0 ) {
                return 'N/A';
            }

            var ratio = locale.format( Number( this.get('dataSeries.0.invoices_of_bills_amount') ) / Number( this.get('dataSeries.0.wires_in_amount') ) * 100, 'n2' );
            return ratio + '%';
        }


    }.property( 'dataSeries.@each.invoices_of_bills_amount', 'dataSeries.@each.wires_in_amount' ),


    renderComponent: function(){
        var self = this;

        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/analytics/company-fee?from_date=' + self.get( 'from_date' ) + '&to_date=' + self.get( 'to_date' ) + '&currency_id=' + self.get( 'currency.id' ) + '&company_id=' + self.get( 'company.id' ),
                type: 'GET'
            } ).then(
                function( response ){
                    if( !self.isDestroyed && response.data !== null ){
                        self.set( 'dataSeries', response.data );
                    }
                },
                function( xhr, status, error ){
                }
            );
        } );
    },

    didInsertElement: function(){
        this.renderComponent();
    },

    //observes the date to change to the new date
    watchDate: function(){
        this.renderComponent();
    }.observes( 'from_date', 'to_date' ),

} );
