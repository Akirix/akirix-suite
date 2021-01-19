import Ember from 'ember';

export default Ember.Component.extend( {

    didInsertElement(){
        this.$('#errorModal').on('hidden.bs.modal', ()=>{
            this.sendAction();
        } );
        this.$('#errorModal').modal( 'show' );
    }
} );