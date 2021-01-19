import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import lookupValidator from 'ember-changeset-validations';
import accountValidations from 'akx-app/validations/accounts';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, DirtyCheck, {
    model( params ){
        return this.store.findRecord( 'account', params.account_id );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let changeset = new Changeset(
            model,
            lookupValidator( accountValidations ),
            accountValidations
        );
        controller.setProperties( {
            changeset: changeset,
            success: false
        } );
        this.send( 'openSidePanel', 'accounts/edit', '', controller );
    },

    checkDirtyState( controller ){
        let changeset = controller.get( 'changeset' );
        if( changeset.get( 'isDirty' ) ){
            let response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
            if( response ){
                changeset.rollback();
            }
            return response;
        }
        return true;
    },

    actions: {
        willTransition( transition ){
            let controller = this.controllerFor( this.routeName );
            if( this.checkDirtyState( controller ) ){
                return true;
            }
            transition.abort();
        },

        closeSidePanel(){
            let controller = this.controllerFor( this.routeName );
            return this.checkDirtyState( controller );
        }
    }
} );
