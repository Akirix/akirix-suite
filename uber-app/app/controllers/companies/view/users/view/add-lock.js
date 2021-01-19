import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'companies/view/users/view', 'companies/view/users/view/locks' ],
    userBinding: 'controllers.companies/view/users/view.model',
    validations: {
        message: {
            presence: true
        }
    },
    actions: {
        save: function(){
            var _this = this;

            _this.set( 'isLocked', true );

            _this.validate().then( function(){
                _this.store.createRecord( 'Lock', {
                    user_id: _this.get( 'user.id' ),
                    message: _this.get( 'message' )
                } ).save().then( function(){
                        _this.transitionToRoute( 'companies.view.users.view.locks' );
                        _this.set( 'isLocked', false );
                    },
                    function( xhr ){
                        _this.get( 'akxUtil' ).handleError( xhr, {
                            scope: _this
                        } );
                        _this.set( 'isLocked', false );
                    } );

            }, function( errors ){
                _this.set( 'isLocked', false );
            } );
        }
    }
} );
