import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view' ],
    registrationBinding: 'controllers.registrations/view.model',

    exemptionWatcher: function(){
        this.get( 'registration' ).notifyPropertyChange( 'documents' );
    }.observes( 'model.exemption.verified' ),

    actions: {
        save: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );
            var exemption = this.get( 'model.exemption' );

            _this.set( 'isLocked', true );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/updateDocument', 'put', {
                sub_document_id: exemption._id,
                document: exemption
            } ).then( function( result ){
                _this.set( 'isLocked', false );
            }, function(){
                _this.set( 'isLocked', false );
            } );
        }
    }
} );

