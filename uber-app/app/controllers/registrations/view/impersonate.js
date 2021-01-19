import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',
    token: null,

    impersonationLink: function(){
        var token = this.get( 'token' );
        if( !Ember.isEmpty( token ) ){
            return config.APP.signup_app_host + '/login?token=' + token._id;
        }
        else{
            return '';
        }
    }.property( 'token' ),

    actions: {
        createToken: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );

            akxUtil._sendRequest( '/signupTokens', 'post', { user_id: registration.user_id } ).then( function( result ){
                _this.set( 'token', result.data.token );
            } );
        }
    }
} );

