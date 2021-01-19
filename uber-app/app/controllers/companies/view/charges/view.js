import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );
import Notify from 'ember-notify';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {},

    actions: {
        cancelCharge: function( charge ){

            var self = this;
            var charge_id = self.get( 'model' ).id;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/charges/' + charge_id,
                type: 'delete',
                contentType: "application/json; charset=utf-8",
                dataType: 'json'

            } ).then( function( response ){
                if( !response.charge ){
                    self.notify.error( 'Could not remove charge.', { closeAfter: 5000 } );
                }
                else{
                    var route = self.container.lookup( 'route:companies.view.charges' );
                    self.notify.success( 'Charge cancelled', { closeAfter: 5000 } );
                    route.refresh();
                }
            } );
        }
    }
} );