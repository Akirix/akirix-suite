import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );


export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    actions: {
        removeRelationship: function () {
            var self = this;
            self.get( 'model' ).deleteRecord();
            self.get( 'model' ).save().then(
                function () {
                    self.notify.success( 'The relationship has been removed.', { closeAfter: 5000 } );
                    var route = self.container.lookup( 'route:companies.view.company-relationships' );
                    route.refresh();
                    self.transitionToRoute( 'companies.view.company-relationships' );
                },
                function ( xhr ) {
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }
    }
} );


