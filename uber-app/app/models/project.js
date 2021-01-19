import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    currency_id: DS.attr(),

    name: DS.attr(),
    type: DS.attr( 'number' ),
    deterministic: DS.attr( 'number' ),
    fixed_profit_margin: DS.attr( 'number' ),
    created_at: DS.attr(),
    funded: DS.attr( 'boolean' ),
    status: DS.attr(),

    node: DS.belongsTo( 'node', { async: true} ),
    bnode: DS.belongsTo( 'node', { async: true} ),
    snodes: DS.hasMany( 'node', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),

    points_out: function(){
        var used = 0;
        this.get( 'snodes' ).forEach( function( item ){
            used += Number( item.get( 'points_total' ) );
        } );
        return used;
    }.property( 'snodes.@each.points_total', 'snodes.@each.points', 'snodes.@each.points_cash', 'snodes.@each.points_guarantee' ),

    points_out_only: function(){
        var used = 0;
        this.get( 'snodes' ).forEach( function( item ){
            used += Number( item.get( 'points' ) );
        } );
        return used;
    }.property( 'snodes.@each.points' ),

    points_left: function(){
        return Number( this.get( 'node.points_total' ) ) - Number( this.get( 'points_out_only' ) );
    }.property( 'node.points_total', 'points_out_only', 'snodes.@each.points' ),

    points_available: function(){
        var allowedPercent = 1 - Number( this.get( 'node.fee_invoice_out' ) );
        var total = Number( this.get( 'node.points_total' ) ) * allowedPercent;
        var used = Number( this.get( 'points_out' ) );
        return Math.max( ( total - used ), 0 );
    }.property( 'node.points_total', 'node.fee_invoice_out', 'points_out' ),

    str_points_available: function(){
        return locale.format( Number( this.get( 'points_available' ) ), 'n2' );
    }.property( 'points_available' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_points_out: function(){
        return locale.format( Number( this.get( 'points_out' ) ), 'n2' );
    }.property( 'points_out' ),

    str_points_left: function(){
        return locale.format( Number( this.get( 'points_left' ) ), 'n2' );
    }.property( 'points_left' ),

    str_points_in: function(){
        return locale.format( Number( this.get( 'node.points_total' ) ), 'n2' );
    }.property( 'node.points_total' ),

    isLinear: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isTree: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    canAddSupplier: function(){
        if( this.get( 'snodes.length' ) === 0 || this.get( 'type' ) === 0 ){
            return true;
        }
        else{
            return false;
        }
    }.property( 'type', 'snodes.length' ),

    strStatus: function(){
        if( this.get( 'status' ) === 0 ){
            return 'Pending';
        }
        else if( this.get( 'status' ) === 2 ){
            return 'Waiting for approval';
        }
        else {
            return 'Active';
        }
    }.property( 'status' ),

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isWaitingActive: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' )
} );

