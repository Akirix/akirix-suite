import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'companies/view/institution-users/view', 'companies/view/institution-users/view/verifications', 'application' ],
    userBinding: 'controllers.companies/view/institution-users/view.model',
    validations: {
        'verification.type': {
            presence: true
        }
    },
    types: [
        { label: 'Two-Factor Auth SMS', val: 0 },
        { label: 'Password Reset E-mail', val: 1 }
    ],

    actions: {
        save: function(){
            var self = this;
            self.validate().then(
                function(){
                    var payload = {
                        user_id: self.get( 'user.id' ),
                        type: Number( self.get( 'verification.type' ) )
                    };
                    Ember.run( function(){
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/institutionVerifications',
                            type: 'POST',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify( { verification: payload } )
                        } ).then(
                            function( response ){
                                self.notify.success( response.message, { closeAfter: 5000 } );
                                var route = self.container.lookup( 'route:companies.view.institution-users.view.verifications' );
                                route.refresh();
                                self.transitionToRoute( 'companies.view.institution-users.view.verifications' );
                            },
                            function( xhr, status, error ){
                                self.notify.error( 'An error has occurred', { closeAfter: 5000 } );
                            }
                        )
                    } )
                },
                function(){
                }
            );
        }
    }
} );
