import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: ['application'],

    validations: {
        "model.name": {
            presence: true
        },
        "model.publish_from": {
            presence: true
        },
        "model.publish_to": {
            presence: true
        },
        "model.notes": {
            presence: true
        }
    },

    actions: {
        save: function(){
            var _this = this;
            _this.set( 'isLocked', true );

            _this.validate().then( function(){
                _this.set( 'isLocked', false );
                _this.get( 'model' ).save().then( function(){
                    _this.set( 'isLocked', false );
                    _this.notify.info( 'Updated' );
                }, function( xhr ){
                    _this.get( 'akxUtil' ).handleError( xhr, {
                        scope: _this
                    } );
                } );
            }, function( errors ){
                _this.set( 'isLocked', false );
            } );
        }
    }

});
