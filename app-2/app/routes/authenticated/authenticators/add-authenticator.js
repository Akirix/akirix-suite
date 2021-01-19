import Ember from 'ember';
import TwoFactorMixin from 'akx-app/mixins/two-factor-check';
import authenticatorsValidations from 'akx-app/validations/authenticators';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, TwoFactorMixin, {
    model(){
        return this.store.createRecord( 'Authenticator' );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        controller.set( 'changeset', new Changeset(
            model,
            lookupValidator( authenticatorsValidations ),
            authenticatorsValidations,
            { skipValidate: true }
        ) );
        this.send( 'openSidePanel', 'company/add-authenticator', '', controller );
    },

    actions: {
        willTransition(){
            let controller = this.controllerFor( this.routeName );
            let changeset = controller.get( 'changeset' );

            if( changeset.get( 'isDirty' ) ){
                controller.get( 'model' ).destroyRecord();
                this.send( 'closeSidePanel', true );
            }
            return true;
        }
    }
} );
