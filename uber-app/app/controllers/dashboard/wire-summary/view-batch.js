import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        'model.response': {
            presence: true
        }
    },

    actions: {
        markReceived: function(){
            var self = this;
            this.validate().then(
                function(){
                    if( !self.get( 'hasError' ) ){
                        self.set( 'isLocked', true );
                        var payload = {
                            response: self.get( 'model.response' )
                        };
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/wireBatches/' + self.get( 'model.id' ) + '/setReceived',
                            type: 'post',
                            contentType: "application/json; charset=utf-8",
                            dataType: 'json',
                            data: JSON.stringify( { data: payload } )
                        } ).then( function( response ){
                            var route = self.container.lookup( 'route:dashboard.wire-summary' );
                            self.notify.success( 'Batch is set as received successfully.', { closeAfter: 5000 } );
                            route.refresh();
                        } );
                    }
                },
                function(){
                } );
        },

        downloadRawData: function(){
            var self = this;
            var token = self.get( 'session.access_token' );
            var url = config.APP.uber_api_host + '/wireBatches/' + self.get( 'model.id' ) + '/download?token=' + token;
            window.open( url, '_self', false );
        }
    }

} );