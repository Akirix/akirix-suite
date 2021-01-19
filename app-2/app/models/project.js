import DS from 'ember-data';
import StringObjectMixin from 'akx-app/mixins/model-locale';
import Ember from 'ember';

export default DS.Model.extend( StringObjectMixin, {
    currency_id: DS.attr(),

    name: DS.attr(),
    type: DS.attr( 'number' ),
    deterministic: DS.attr( 'number' ),
    fixed_profit_margin: DS.attr( 'number' ),
    invoice_deadline: DS.attr( 'number' ),
    created_at: DS.attr(),
    funded: DS.attr( 'boolean' ),
    status: DS.attr(),

    node: DS.belongsTo( 'node', { async: true } ),
    bnode: DS.belongsTo( 'node', { async: true } ),
    snodes: DS.hasMany( 'node', { async: true } ),
    documents: DS.hasMany( 'document', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),

    points_out: function(){
        if( Ember.isEmpty( this.get( 'snodes' ) ) ){
            return 0;
        }
        return this.get( 'snodes' ).reduce( function( acc, item ){
            return acc + Number( item.get( 'points_total' ) );
        }, 0 );
    }.property( 'snodes.@each.points_total', 'snodes.@each.points', 'snodes.@each.points_cash', 'snodes.@each.points_guarantee' ),

    manySnodes: function(){
        return this.get( 'snodes.length' ) > 1;
    }.property( 'snodes.length' ),

    points_out_only: function(){
        return this.get( 'snodes' ).reduce( function( acc, item ){
            return acc + Number( item.get( 'points' ) );
        }, 0 );
    }.property( 'snodes.@each.points' ),

    cash_out_only: function(){
        return this.get( 'snodes' ).reduce( function( acc, item ){
            return acc + Number( item.get( 'points_cash' ) );
        }, 0 );
    }.property( 'snodes.@each.points_cash' ),

    points_left: function(){
        return Number( this.get( 'node.points_total' ) ) - Number( this.get( 'points_out_only' ) );
    }.property( 'node.points_total', 'points_out_only', 'snodes.@each.points' ),

    points_available: function(){
        let allowedPercent = 1 - this.get( 'node.company.fees' ).objectAt( 0 ).get( 'fee_invoice_out' );
        let total = Number( this.get( 'node.points_total' ) ) * allowedPercent;
        let used = Number( this.get( 'points_out' ) );
        return Math.max( ( total - used ), 0 );
    }.property( 'node.points_total', 'points_out', 'node.company.fees.@each.fee_data' ),

    canAddSupplier: function(){
        return this.get( 'isTree' ) || ( this.get( 'isLinear' ) && this.get( 'hasNoSupplier' ) );
    }.property( 'type', 'snodes.length' ),

    canAddBuyer: function(){
        if( this.get( 'isSmart' ) ){
            return this.get( 'node.isPendingSmart' );
        }
        return ( this.get( 'hasNoBuyer' ) && !this.get( 'node.isInvited' ) );
    }.property( 'type', 'bnode.length' ),

    hasNoSupplier: function(){
        return this.get( 'snodes.length' ) === 0;
    }.property( 'snodes.length' ),

    hasNoBuyer: function(){
        return Ember.isEmpty( this.get( 'bnode.content' ) );
    }.property( 'bnode' ),

    getName: function(){
        return this.get( 'node.name' ) ? this.get( 'node.name' ) : this.get( 'name' );
    }.property( 'name', 'node.name' ),

    isLinear: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isTree: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isSmart: function(){
        return this.get( 'deterministic' ) === 1;
    }.property( 'deterministic' ),

    isFixedProfitMargin: function(){
        return this.get( 'fixed_profit_margin' ) === 1;
    }.property( 'fixed_profit_margin' ),

    canReturnFunds: function(){
        return Number( this.get( 'node.points_total' ) ) > 0;
    }.property( 'node.points_total' ),

    strType: function(){
        let stringList = this.get( 'getStringList' );
        if( this.get( 'isTree' ) ){
            return stringList.tree;
        }
        else if( this.get( 'isSmart' ) ){
            return stringList.smart;
        }
        return stringList.linear;
    }.property( 'node.points_total' ),

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isAlmostActive: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    isPending: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    notAlone: function(){
        return !this.get( 'hasNoBuyer' ) || !this.get( 'hasNoSupplier' );
    }.property( 'hasNoBuyer', 'hasNoSupplier' ),

    currentStep: function(){
        if( this.get( 'node.isPendingSmart' ) ){
            return 0;
        }
        else if( this.get( 'isPending' ) ){
            return 1;
        }
        else if( this.get( 'isAlmostActive' ) ){
            return 2;
        }
    }.property( 'status', 'node.status' ),

    disableInvoiceEdit: function(){
        return this.get( 'isSmart' ) && !this.get( 'hasNoSupplier' );
    }.property( 'isSmart', 'hasNoSupplier' )
} );
