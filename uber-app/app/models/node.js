import Ember from 'ember';
import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    nodeItemsSort: ['name:asc'],
    sortedNodeItems: Ember.computed.sort( 'node_items', 'nodeItemsSort' ),

    parent_id: DS.attr(),
    account_id: DS.attr(),
    company_id: DS.attr(),
    fund_id: DS.attr(),
    project_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    points: DS.attr( 'number' ),
    points_guarantee: DS.attr( 'number' ),
    points_cash: DS.attr( 'number' ),
    discount_rate: DS.attr( 'number' ),
    name: DS.attr(),
    allow_funding: DS.attr(),
    notes: DS.attr(),
    status: DS.attr( 'number' ),

    account: DS.belongsTo( 'account', { async: true} ),
    //project: DS.belongsTo( 'project', { async: true, inverse: 'node' } ),
    company: DS.belongsTo( 'company', { async: true } ),
    fund: DS.belongsTo( 'fund', { async: true } ),
    invoices: DS.hasMany( 'invoice', { async: true } ),
    node_items: DS.hasMany( 'node_item', { async: true } ),
    amendments: DS.hasMany( 'amendments', { async: true } ),

    points_total: function(){
        return Number( this.get( 'points' ) ) + Number( this.get( 'points_cash' ) ) + Number( this.get( 'points_guarantee' ) );
    }.property( 'points', 'points_cash', 'points_guarantee' ),

    points_available: function(){
        return Number( this.get( 'points_cash' ) ) + Number( this.get( 'points_guarantee' ) );
    }.property( 'points_cash', 'points_guarantee' ),

    invoice_count: function(){
        var count = 0;
        var self = this;
        this.get( 'invoices' ).forEach( function( invoice ){
            if( invoice.get( 'status' ) === 1 ){
                count++;
            }
        } );
        return count;
    }.property( 'invoices.@each.status' ),

    isInvited: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isWaiting: function(){
        return this.get( 'status' ) === 4;
    }.property( 'status' ),

    str_points: function(){
        return locale.format( Number( this.get( 'points' ) ), 'n2' );
    }.property( 'points' ),

    str_points_total: function(){
        return locale.format( Number( this.get( 'points_total' ) ), 'n2' );
    }.property( 'points_total' ),

    str_points_available: function(){
        return locale.format( Number( this.get( 'points_available' ) ), 'n2' );
    }.property( 'points_available' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' )

} );

