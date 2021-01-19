import Ember from 'ember';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );


export default Ember.Component.extend( {
    tagName: 'div',
    layoutName: 'analytics-fee-totals',
    from_date: null,
    to_date: null,

    renderComponent: function(){
        var self = this;
        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/analytics/fee-totals?from_date=' + self.get( 'from_date' ) + '&to_date=' + self.get( 'to_date' ),
                type: 'GET'
            } ).then(
                function( response ){
                    if( response.data !== null ){
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