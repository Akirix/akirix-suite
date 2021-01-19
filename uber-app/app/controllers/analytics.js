import Ember from 'ember';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    selectedPlot: 'analytics-invoice-currencies',
    analytics_option: 'analytics-invoice-currencies',
    period_from: moment( new Date( new Date().getFullYear(), new Date().getMonth(), 1 ) ).subtract( 90, 'days' ).format( 'YYYY-MM-01' ),
    period_to: moment( new Date( new Date().getFullYear(), new Date().getMonth() + 1, 0 ) ).format( 'YYYY-MM-DD' ),
    plot_from: moment( new Date( new Date().getFullYear(), new Date().getMonth(), 1 ) ).subtract( 90, 'days' ).format( 'YYYY-MM-01' ),
    plot_to: moment( new Date( new Date().getFullYear(), new Date().getMonth() + 1, 0 ) ).format( 'YYYY-MM-DD' ),

    analyticsOptions: [
        { label: 'Invoice Volume', val: 'analytics-invoice-currencies' },
        { label: 'Wire In Volume', val: 'analytics-wire-in-currencies' },
        { label: 'Wire Out Volume', val: 'analytics-wire-out-currencies' },
        { label: 'Internal Transfer Volume', val: 'analytics-internal-currencies' },
        { label: 'FX Volume', val: 'analytics-fx-currencies' },
        { label: 'Fee Volume', val: 'analytics-fees-currencies' },
        { label: 'Fee Details', val: 'analytics-fee-totals' },
        { label: 'Cash On Platform', val: 'analytics-cop' },
        { label: 'IP Map', val: 'analytics-ip-map' },
        { label: 'Trading Network', val: 'analytics-network' }

    ],

    actions: {
        plot: function(){
            this.set( 'selectedPlot', this.get( 'analytics_option' ) );
            this.set( 'plot_from', this.get( 'period_from' ) + ' 00:00:00' );
            this.set( 'plot_to', this.get( 'period_to' ) + ' 23:59:59' );
        }
    },

} );
