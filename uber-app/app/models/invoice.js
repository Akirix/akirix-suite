import Ember from 'ember';
import DS from 'ember-data';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

function abbreviateNumber( value ){
    value = Math.round( value );
    var newValue = value;
    if( value >= 1000 ){
        var suffixes = ["", "k", "m", "b", "t"];
        var suffixNum = Math.floor( ("" + value).length / 3 );
        var shortValue = '';
        for( var precision = 2; precision >= 1; precision-- ){
            shortValue = parseFloat( (suffixNum !== 0 ? (value / Math.pow( 1000, suffixNum ) ) : value).toPrecision( precision ) );
            var dotLessShortValue = (shortValue + '').replace( /[^a-zA-Z 0-9]+/g, '' );
            if( dotLessShortValue.length <= 2 ){
                break;
            }
        }
        newValue = shortValue + suffixes[suffixNum];
    }
    return newValue;
}

function delimitNumbers( str ){
    return (str + "").replace( /\b(\d+)((\.\d+)*)\b/g, function( a, b, c ){
        return (b.charAt( 0 ) > 0 && !(c || ".").lastIndexOf( "." ) ? b.replace( /(\d)(?=(\d{3})+$)/g, "$1," ) : b) + c;
    } );
}

export default DS.Model.extend( {
    invoiceItemsSort: ['name:asc'],
    sortedInvoiceItems: Ember.computed.sort( 'invoice_items', 'invoiceItemsSort' ),

    company_id: DS.attr(),
    account_id: DS.attr(),
    node_id: DS.attr(),
    project_id: DS.attr(),
    currency_id: DS.attr(),
    created_at: DS.attr(),
    updated_at: DS.attr(),
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

    invoice_items: DS.hasMany( 'invoice_item', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),
    node: DS.belongsTo( 'node', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),
    project: DS.belongsTo( 'project', { async: true } ),

    sub_total: function(){
        var total = 0.00;
        this.get( 'invoice_items' ).forEach( function( item ){
            total += item.get( 'price' ) * item.get( 'quantity' );
        } );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return Math.max( total, 0 );
        }
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
        var total = ( Number( this.get( 'sub_total' ) ) + math.round( Number( this.get( 'tax' ) ), 2 ) );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return total;
        }
    }.property( 'sub_total', 'tax' ),

    isDraft: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isPending: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isPartiallyPaid: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    isPaid: function(){
        return this.get( 'status' ) === 3;
    }.property( 'status' ),

    isProjectInvoice: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isPlatformInvoice: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isExternalInvoice: function(){
        return this.get( 'type' ) === 2;
    }.property( 'type' ),

    toShow: function(){
        return this.get( 'status' ) === 0 || this.get( 'status' ) === 1 || this.get( 'status' ) === 2;
    }.property( 'status' ),

    // Formatted Strings for display

    created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),
    
    str_invoice_date: function(){
        return moment( this.get( 'invoice_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'invoice_date' ),

    str_invoice_period_from: function(){
        return moment( this.get( 'invoice_period_from' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'invoice_period_from' ),

    str_invoice_period_to: function(){
        return moment( this.get( 'invoice_period_to' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'invoice_period_to' ),

    str_total_abbreviated: function(){
        return abbreviateNumber( this.get( 'total' ) );
    }.property( 'total' ),

    str_sub_total: function(){
        return locale.format( Number( this.get( 'sub_total' ) ), 'n2' );
    }.property( 'sub_total' ),

    str_tax: function(){
        return locale.format( Number( this.get( 'tax' ) ), 'n2' );
    }.property( 'tax' ),

    str_total: function(){
        return locale.format( Number( this.get( 'total' ) ), 'n2' );
    }.property( 'total' ),

    str_remaining_total: function(){
        var total = Number( this.get( 'remaining_amount' ) );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return locale.format( total, 'n2' );
        }
    }.property( 'remaining_amount' ),

    url_pdf: function(){
        return config.APP.uber_api_host + '/invoices/' + this.get( 'id' ) + '/pdf';
    }.property( 'id' )

} );

