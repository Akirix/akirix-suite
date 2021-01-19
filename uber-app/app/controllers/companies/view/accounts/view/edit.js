import Ember from 'ember';
import EmberValidations from 'ember-validations';
import _ from 'lodash/lodash';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        "account.name": {
            presence: true
        }
    },


    actions: {

        save: function(){
            var self = this;

            self.set( 'isLocked', true );
            var accountModel = self.get( 'account' );
            var newObj = {};
            var hasError = false;

            if( hasError ){
                self.set( 'isLocked', false );
                return;
            }

            accountModel.save().then( function(){
                self.set( 'isLocked', false );
                self.notify.success( 'Update complete', { closeAfter: 5000 } );
                self.transitionToRoute( 'companies.view.accounts' );
            }, function( xhr ){
                self.get( 'akxUtil' ).handleError( xhr, {
                    scope: self
                } );
            } );
            self.set( 'isLocked', false );


        }
    }
} );