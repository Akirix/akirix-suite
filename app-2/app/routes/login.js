import Ember from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import loginValidations from 'akx-app/validations/login';

export default Ember.Route.extend( UnauthenticatedRouteMixin, StringObjectMixin, {
    routeIfAlreadyAuthenticated: 'authenticated.dashboard',
    
    model(){
        return new Changeset(
            { email: '', password: '' },
            lookupValidator( loginValidations ),
            loginValidations, { skipValidate: true }
        );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        
        if( !Ember.isEmpty( controller.get( 'token' ) ) ){
            controller.send( 'login' );
        }
        else{
            let changeset = new Changeset(
                model,
                lookupValidator( loginValidations ),
                loginValidations,
                { skipValidate: true }
            )
            controller.set( 'changeset', changeset );
        }

    },

    activate(){
        document.title = "Akirix Payment System";
    }
} );
