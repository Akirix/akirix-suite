import Ember from 'ember';

export default Ember.Mixin.create( {
    actions: {
        willTransition: function( transition ){
            var model = this.currentModel;

            if( model.get( 'isDirty' ) ){
                var response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
                if( !response ){
                    transition.abort();
                }
                else{
                    model.rollback();
                }
            }
        }
    }
} );