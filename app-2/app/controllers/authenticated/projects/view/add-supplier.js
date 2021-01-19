import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {

    fee: function(){
        return ( this.get( 'model.fee.fee_invoice_out' ) * 100 );
    }.property(),

    totalDiscountRate: function(){
        return ( ( this.get( 'model.fee.fee_invoice_out' ) * 100 ) + Number( this.get( 'changeset.discount_rate' ) ) ).toFixed( 2 );
    }.property( 'changeset.discount_rate' ),

    actions: {
        addNode(){
            let changeset = this.get( 'changeset' );
            let project = this.get( 'model.project' );

            changeset.validate().then( () =>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid ) =>{
                if( isValid ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'POST',
                        data: JSON.stringify( { data: {
                            account_number: changeset.get( 'account_number' ),
                            discount_rate: Number( this.get( 'totalDiscountRate' ) )
                        } } )
                    }, `/projects/${project.get( 'id' )}/add_supplier` );
                }
                return isValid;
            } ).then( ( response ) =>{
                if( response ){
                    let promises = Ember.A();
                    if( !Ember.isEmpty( this.get( 'documents' ) ) ){
                        this.get( 'documents' ).forEach( function( item ){
                            item.set( 'model_id', response.node.id );
                            item.set( 'status', 1 );
                            promises.push( item.save() );
                        } );
                    }
                    // Save node items/ price list
                    if( project.get( 'type' ) === 1 ){
                        this.get( 'nodeItems' ).forEach( function( item ){
                            item.set( 'node_id', response.node.id );
                            promises.push( item.save() );
                        } );
                    }
                    return Ember.RSVP.Promise.all( promises );
                }
                return response;
            } ).then( ( valid ) =>{
                this.set( 'isLocked', false );
                if( valid ){
                    project.reload();
                    this.set( 'success', true );
                }
            } ).catch( ( err ) =>{
                this.set( 'isLocked', false );
                if( err instanceof Ember.Error ){
                    this.send( 'error', err );
                }
                else{
                    this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                }
            } );
        }
    }
} );
