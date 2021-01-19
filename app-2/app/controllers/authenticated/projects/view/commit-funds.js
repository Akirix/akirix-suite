import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {
    availableCash: function(){
        let model = this.get( 'model' );
        let allowedPercent = 1 - model.fees.objectAt( 0 ).get( 'fee_invoice_out' );
        if( model.project.get( 'isSmart' ) ){
            return  model.account.get( 'balance' );
        }
        return model.account.get( 'balance' ) * allowedPercent;
    }.property( 'model.account.balance' ),

    availablePoints: function(){
        let model = this.get( 'model' );
        let allowedPercent = 1 - model.fees.objectAt( 0 ).get( 'fee_invoice_out' );
        let total = Number( model.node.get( 'points_total' ) ) * allowedPercent;
        let used = Number( model.project.get( 'points_out_only' ) );
        return Math.max( ( total - used ), 0 );
    }.property( 'model.project.points_out_only' ),

    actions: {
        commitFunds(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                if( isValid ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'POST',
                        data: JSON.stringify( { data: changeset.get( '_content' ) } )
                    }, `/nodes/${this.get( 'model.snode.id' )}/point_funds` );
                }
                return isValid;
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    let model = this.get( 'model' );
                    model.snode.reload();
                    model.node.reload();
                    model.project.reload();
                    model.node.get('account').reload();
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
