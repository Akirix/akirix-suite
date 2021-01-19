import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend( {
    nodeItemsSort: [ 'name:asc' ],
    sortedNodeItems: Ember.computed.sort( 'node_items', 'nodeItemsSort' ),

    parent_id: DS.attr(),
    account_id: DS.attr(),
    company_id: DS.attr(),
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
    nodeItems: DS.attr(),

    account: DS.belongsTo( 'account', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),
    invoices: DS.hasMany( 'invoice', { async: true } ),
    node_items: DS.hasMany( 'node-item', { async: true } ),
    external_nodes: DS.hasMany( 'external-node', { async: true } ),

    points_total: function(){
        return Number( this.get( 'points' ) ) + Number( this.get( 'points_cash' ) ) + Number( this.get( 'points_guarantee' ) );
    }.property( 'points', 'points_cash', 'points_guarantee' ),

    isInvited: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    points_available: function(){
        return Number( this.get( 'points_cash' ) ) + Number( this.get( 'points_guarantee' ) );
    }.property( 'points_cash', 'points_guarantee' ),

    hasPendingInvoice: function(){
        return this.get( 'invoices' ).find( ( invoice )=>{
            return invoice.get( 'isPending' );
        } );
    }.property( 'invoices.length' ),

    manyEnodes: function(){
        return this.get( 'external_nodes.length' ) > 1;
    }.property( 'external_nodes.length' ),

    isPendingSmart: function(){
        return this.get( 'status' ) === 4;
    }.property( 'status' )
} );