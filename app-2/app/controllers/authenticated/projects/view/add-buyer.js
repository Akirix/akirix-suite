import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {
    showBuyerType: function(){
        if( !Ember.isEmpty( this.get( 'externalNodes' ) ) ){
            this.set( 'changeset.is_external', true );
        }
    }.observes( 'externalNodes.length' ),

    fee: function(){
        return ( this.get( 'model.fee.fee_invoice_out' ) * 100 );
    }.property(),

    totalDiscountRate: function(){
        return ( ( this.get( 'model.fee.fee_invoice_out' ) * 100 ) + Number( this.get( 'changeset.discount_rate' ) ) ).toFixed( 2 );
    }.property( 'changeset.discount_rate' ),

    actions: {
        addBuyer(){
            if( this.get( 'changeset.is_external' ) ){
                this.send( 'addExternalNode' );
            }
            else{
                this.send( 'addNode' );
            }
        },

        addExternalNode(){
            var self = this;
            let changeset = this.get( 'changeset' );
            let project = this.get( 'model.project' );
            this.store.createRecord( 'external-node', {
                name: changeset.get( 'name' ),
                point_of_contact: changeset.get( 'point_of_contact' ),
                phone: changeset.get( 'phone' ),
                email: changeset.get( 'email' ),
                node_id: project.get( 'node.id' ),
                project_id: project.get( 'id' )
            } ).save().then( ()=>{
                self.set( 'isLocked', false );
                self.set( 'success', true );
            } ).catch( ( err ) =>{
                self.set( 'isLocked', false );
                if( err instanceof Ember.Error ){
                    self.send( 'error', err );
                }
                else{
                    self.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                }
            } );
        },

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
                    }, `/projects/${project.get( 'id' )}/add_buyer` );
                }
                return isValid;
            } ).then( ( isValid ) =>{
                if( isValid ){
                    let promises = Ember.A();
                    if( !Ember.isEmpty( this.get( 'documents' ) ) ){
                        this.get( 'documents' ).forEach( function( item ){
                            item.set( 'model_id', project.get( 'node.id' ) );
                            item.set( 'status', 1 );
                            promises.push( item.save() );
                        } );
                    }
                    // Save node items/ price list
                    if( project.get( 'type' ) === 1 ){
                        this.get( 'nodeItems' ).forEach( function( item ){
                            promises.push( item.save() );
                        } );
                    }
                    return Ember.RSVP.Promise.all( promises );
                }
                return isValid;
            } ).then( ( isValid ) =>{
                this.set( 'isLocked', false );
                if( isValid ){
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
