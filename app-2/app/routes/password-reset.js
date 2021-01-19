import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import usersValidations from 'akx-app/validations/users';

export default Ember.Route.extend( UnauthenticatedRouteMixin, StringObjectMixin, {
    activate(){
        document.title = "Password Reset";
    },

    model(){
        return { password: '', confirmation: '' };
    },

    setupController( controller, model ){
        this._super( ...arguments );
        const changeset = new Changeset(
            model,
            lookupValidator( usersValidations ),
            usersValidations,
            { skipValidate: true }
        );
        controller.set( 'changeset', changeset );
    }
} );
