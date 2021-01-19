import Ember from 'ember';

export default Ember.Controller.extend( {
    actions: {
        close(){
            Ember.$( '.card.active' ).removeClass( 'active' ).parent().removeClass( 'hover' );
            Ember.$( '.hide-stuff' ).removeClass( 'show' );
            Ember.$( '.map' ).css( {
                top:'90px',
                left:0
            } );
            this.transitionToRoute( 'authenticated.projects.view' );
            this.send( 'closeSidePanel', true );
        },
        payInvoice(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                if( isValid ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'post',
                        data: JSON.stringify( { data: changeset.get( '_content' ) } )
                    }, `/invoices/${changeset.get( 'invoice_id' )}/pay` );
                }
                return isValid;
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false);
                if( isValid ){
                    this.get( 'model.invoice' ).reload();
                    this.get( 'model.project' ).reload();
                    this.get( 'model.node' ).reload();
                    this.get( 'model.account' ).reload();
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false);
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );