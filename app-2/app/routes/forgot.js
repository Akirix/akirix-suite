import Ember from 'ember';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import { validateFormat } from 'ember-changeset-validations/validators';

export default Ember.Route.extend( UnauthenticatedRouteMixin, StringObjectMixin, {
    model(){
        return { email: '' };
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let validations = {
            email: validateFormat( { type: 'email' } )
        };
        controller.set( 'changeset', new Changeset(
            model,
            lookupValidator( validations ),
            validations,
            { skipValidate: true } 
        ) );
    },

    activate: function(){
        document.title = "Password Recovery";
    }
} );
