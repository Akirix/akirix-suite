import Ember from 'ember';

export default Ember.Component.extend( {
    modelRoute: null,
    modelId: null,
    item: null,
    tagName: '',

    init: function(){
        this._super();
        var item = this.get( 'item' );
        var store = this.get( 'store' );
        var self = this;

        switch( item.get( 'model' ) ){
            case 'Wire':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.wires.view' );
                }
                else{
                    this.set( 'modelRoute', 'wires.index.view' );
                }
                break;
            case 'FXRequest':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.fx-requests.view' );
                }
                else{
                    this.set( 'modelRoute', 'fx-requests.index.view' );
                }
                break;
            case 'CommissionPayment':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.commissions.payments.view' );
                }
                else{
                    this.set( 'modelRoute', 'dashboard.pending-commission-payments.index.view' );
                }
                break;
            case 'Commission':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.commissions.view' );
                }
                else{
                    this.set( 'modelRoute', 'affiliates.commissions.view' );
                }
                break;
            case 'Ticket':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.tickets.view' );
                }
                else{
                    this.set( 'modelRoute', 'tickets.index.view' );
                }
                break;
            case 'Invoice':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.invoices.index.view' );
                }
                break;
            case 'Charge':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.charges.view' );
                }
                break;
            case 'Transaction':
                if( item.get( 'company_id' ) ){
                    this.set( 'modelRoute', 'companies.view.accounts.view.transactions.view' );
                }
                break;
        }
    }
} );

