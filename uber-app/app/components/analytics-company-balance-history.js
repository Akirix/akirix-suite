import Ember from 'ember';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );


export default Ember.Component.extend( {
    tagName: 'div',
    layoutName: 'analytics-company-balance-history',
    classNames: [ 'highcharts' ],
    config: {},
    from_date: null,
    to_date: null,

    setConfig: function( type ){
        this.get('config').xAxis = {
            type: 'datetime',
            min: new Date( this.get( 'from_date' ) ).getTime(),
            max: new Date( this.get( 'to_date' ) ).getTime()
        };
        this.get('config').yAxis = {
            min: 0,
            labels: {
                // format: this.get( 'currency' ) + '{value:,.0f}',
                style: {
                    color: 'black'
                },
                useHTML: true
            },
            title: {
                text: 'Balance',
                style: {
                    color: 'black'
                }
            }
        };

        this.get('config').title = { text: this.title || false };
        this.get('config').credits = { enabled: false };
        this.get('config').lang = { thousandsSep: ',' };
    },

    renderHighchart: function(){
        return this.$().highcharts( this.get('config') );
    },

    renderComponent: function(){
        var self = this;

        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/analytics/account-balance-history?from_date=' + self.get( 'from_date' ) + '&to_date=' + self.get( 'to_date' ) + '&company_id=' + self.get( 'company.id' ),
                type: 'GET'
            } ).then(
                function( response ){
                    if( !self.isDestroyed && !Ember.isEmpty( response.data ) ){
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
                    else if( self.$() ){
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

    //observes the date to change to the new date
    watchDate: function(){
        this.renderComponent();
    }.observes( 'from_date', 'to_date' )
} );
