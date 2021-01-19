import Ember from 'ember';
import config from 'uber-app/config/environment';
var observer = Ember.observer;

export default Ember.Component.extend( {
    tagName: 'div',
    classNames: [ 'highcharts' ],
    config: {},
    from_date: null,
    to_date: null,

    setConfig: function( type ){
        this.config.xAxis = {
            type: 'datetime',
            min: new Date( this.get( 'from_date' ) ).getTime(),
            max: new Date( this.get( 'to_date' ) ).getTime()
        };
        this.config.yAxis = {
            min: 0,
            labels: {
                format: this.get( 'currency.symbol' ) + '{value:,.0f}',
                style: {
                    color: 'black'
                },
                useHTML: true
            },
            title: {
                text: 'Amount',
                style: {
                    color: 'black'
                }
            }
        };

        this.config.title = { text: this.title || false };
        this.config.credits = { enabled: false };
        this.config.lang = { thousandsSep: ',' };
    },

    renderHighchart: function(){
        return this.$().highcharts( this.config );
    },

    renderComponent: function(){
        var self = this;

        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/analytics/transactions-wire-in?currency_id=' + self.get( 'currency.id' ) + '&from_date=' + self.get( 'from_date' ) + '&to_date=' + self.get( 'to_date' ) + '&company_id=' + self.get( 'company.id' ),
                type: 'GET'
            } ).then(
                function( response ){
                    if( !self.isDestroyed && !Ember.isEmpty( response.data ) && !Ember.isEmpty( response.data[ 0 ].data ) ){
                        var seriesData = [];
                        response.data.forEach( function( item ){
                            var series = {
                                name: item.name,
                                type: 'line',
                                data: []
                            };

                            item.data.forEach( function( d ){
                                series.data.push( [
                                    new Date( d[ 0 ] ).getTime(),
                                    d[ 1 ]
                                ] );
                            } );
                            seriesData.push( series );
                        } );

                        self.set( 'config', {
                            series: seriesData
                        } );
                        self.setConfig();
                        return self.renderHighchart();
                    }
                    else if( !self.isDestroyed ){
                        self.$().html( '<div class="align-center valign-middle text-gray-light" style="padding: 100px; background-color: #f2f4f5; "><i class="fa fa-line-chart fa-5x"></i><br/>No Data Yet</div>' );
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

    watchDate: function(){
        this.renderComponent();
    }.observes( 'from_date', 'to_date' )

} );

