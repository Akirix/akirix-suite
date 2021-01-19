import Ember from 'ember';
import DS from 'ember-data';
import config from 'akx-app/config/environment';
import StringObjectMixin from 'akx-app/mixins/model-locale';

export default DS.Model.extend( StringObjectMixin, {
    invoiceItemsSort: ['name:asc'],
    sortedInvoiceItems: Ember.computed.sort( 'invoice_items', 'invoiceItemsSort' ),

    company_id: DS.attr(),
    account_id: DS.attr(),
    node_id: DS.attr(),
    project_id: DS.attr(),
    currency_id: DS.attr(),

    parent_id: DS.attr(),
    invoice_date: DS.attr(),
    invoice_period_from: DS.attr(),
    invoice_period_to: DS.attr(),
    name: DS.attr(),
    title: DS.attr(),
    order: DS.attr(),
    account_number: DS.attr(),
    to_company_id: DS.attr(),
    to_company_name: DS.attr(),
    to_company_email: DS.attr(),
    to_company_phone: DS.attr(),
    to_company_address: DS.attr(),
    to_company_city: DS.attr(),
    to_company_state_province: DS.attr(),
    to_company_postal_code: DS.attr(),
    to_company_country: DS.attr(),
    notes: DS.attr(),
    amount: DS.attr( 'number' ),
    remaining_amount: DS.attr( 'number' ),
    tax_rate: DS.attr( 'number' ),
    type: DS.attr( 'number' ),
    status: DS.attr( 'number' ),
    isMine: DS.attr( 'boolean' ),
    created_at: DS.attr(),
    invoiceItems: DS.attr(),

    invoice_items: DS.hasMany( 'invoice-item', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),
    toCompany: DS.belongsTo( 'company', { async: true } ),
    node: DS.belongsTo( 'node', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),
    project: DS.belongsTo( 'project', { async: true } ),

    statusIcon: function(){
        let stringList = this.get( 'getStringList' );
        switch( this.get( 'status' ) ){
            case 0:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.draft}"><i class="akx-icon akx-empty-file"></i></span>`;
            case 1:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.pending}"><i class="akx-icon akx-submitted"></i></span>`;
            case 2:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.partial}"><i class="akx-icon akx-partial-paid"></i></span>`;
            case 3:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.paid}"><i class="akx-icon akx-success"></i></span>`;
            case 4:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.cancelled}"><i class="akx-icon akx-rejected"></i></span>`;
            default:
                return '';
        }
    }.property( 'status' ),

    getType: function(){
        let stringList = this.get( 'getStringList' );
        if( this.get( 'isProject' ) ){
            return stringList.isProject;
        }
        else if( this.get( 'isInternal' ) ){
            return stringList.isInternal;
        }
        return stringList.isExternalInvoice;
    }.property( 'type' ),

    isInternal: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isExternalInvoice: function(){
        return this.get( 'type' ) === 2;
    }.property( 'type' ),

    isProject: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isPending: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isPartiallyPaid: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    isPaidFull: function(){
        return this.get( 'status' ) === 3;
    }.property( 'status' ),

    isDraft: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    getName: function(){
        return this.get( 'title' ) ? this.get( 'title' ) : this.get( 'name' );
    }.property( 'title', 'name' ),

    sub_total: function(){
        return this.get( 'invoice_items' ).reduce( ( acc, item )=>{
            return acc += item.get( 'price' ) * item.get( 'quantity' );
        }, 0 );
    }.property( 'invoice_items.@each.price', 'invoice_items.@each.quantity' ),

    tax: function(){
        var tax = ( Number( this.get( 'sub_total' ) ) * ( this.get( 'tax_rate' ) / 100 ) );
        if( isNaN( tax ) ){
            return 0.00;
        }
        else{
            return tax;
        }
    }.property( 'sub_total', 'tax_rate' ),

    total: function(){
        var total = ( Number( this.get( 'sub_total' ) ) + Number( this.get( 'tax' ) ) );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return total;
        }
    }.property( 'sub_total', 'tax' ),

    urlPdf: function(){
        return config.APP.api_host + '/invoices/' + this.get( 'id' ) + '/pdf';
    }.property( 'id' )
} );

