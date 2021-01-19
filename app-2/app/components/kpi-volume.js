import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'div',
    classNames: [ 'kpi' ],
    highchartsConfig: {
        chart: {
            type: 'area'
        },
        xAxis: {
            allowDecimals: false,
            min: 1,
            max: 31
        },
        yAxis: {
            labels: {
                format: '${value}'
            },
            title: {}
        },
        defs: {
            gradient0: {
                tagName: 'linearGradient',
                id: 'gradient-0',
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1,
                children: [{
                    tagName: 'stop',
                    offset: 0
                }, {
                    tagName: 'stop',
                    offset: 1
                }]
            }
        },
        ignoreHiddenSeries : false
    },

    getData: function(){
        let highchartsConfig = this.get( 'highchartsConfig' );
        let stringList = this.get( 'localeFile.kpi-volume' );
        this.get( 'akxUtil' ).authAjax( {
            type: 'GET',
        }, `/stats/transactions-invoice?currency_id=${this.get( 'currency' )}` ).then( ( response )=>{
            if( !Ember.isEmpty( response.data ) ){
                this.set( 'hasData' )
                let seriesData = [];
                response.data.forEach( ( item )=>{
                    let series = {
                        name: item.name,
                        type: 'area',
                        data: []
                    };
                    item.data.forEach( function( d ){
                        series.data.push([
                            new Date( d[ 0 ] ).getDate(),
                            d[ 1 ]
                        ]);
                    } );
                    seriesData.push( series );
                } );
                highchartsConfig.yAxis.title[ 'text' ] = stringList.yAxisTitle;
                highchartsConfig.series = seriesData;
                highchartsConfig.title = { text:  false };
                highchartsConfig.credits = { enabled: false };
                this.$().highcharts( highchartsConfig )
            }
            else{
                this.$().html( `<div class="align-center valign-middle text-gray" style="padding-top: 100px;"><i class="fa fa-line-chart fa-5x"></i><br/>${stringList.noData}</div>` );
            }
        } ).catch( ( err )=>{
            this.sendAction( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
        } );
        this.set( 'stringList', stringList );
    }.on( 'didInsertElement' )
} );
