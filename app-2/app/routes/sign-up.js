import Ember from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import { validateConfirmation, validateFormat } from 'ember-changeset-validations/validators';

export default Ember.Route.extend( UnauthenticatedRouteMixin, StringObjectMixin, {
    model: function(){
        return {
            email: '',
            emailConfirmation: '',
            password: '',
            passwordConfirmation: ''
        };
    },
    setupController( controller, model ){
        this._super( controller, model );
        let passwordStrength = controller.get( 'passwordStrength' );
        let passwordError = controller.get( 'stringList.passwordError' );
        let validations = {
            password( key, newValue ){
                return passwordStrength.strength( newValue || '' ).then( ( res )=>{
                    if( res.score < 4 ){
                        return `${key} ${passwordError}`;
                    }
                    return true;
                } );
            },
            passwordConfirmation: validateConfirmation( { on: 'password' } ),
            email: validateFormat( { type: 'email' } ),
            emailConfirmation: validateConfirmation( { on: 'email' } )
        };
        let changeset = new Changeset( model, lookupValidator( validations ), validations, { skipValidate: true } );
        controller.set( 'changeset', changeset );
    },
    activate: function(){
        document.title = "Sign Up";
    }
} );
