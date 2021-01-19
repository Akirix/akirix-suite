import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import { validateNumber } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, {
    model(){
        return this.modelFor( 'authenticated.projects.view' ).project;
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let errorMsg = controller.get( 'stringList.amountErrorMessage' );
        let validations = {
            amount: [
                validateNumber( { gt: 0, positive: true, allowBlank: false } ),
                function( key, newValue ){
                    return newValue > model.get( 'points_left' ) ? errorMsg : true;
                }
            ]
        };
        controller.setProperties( {
            success: false,
            changeset: new Changeset(
                { amount: 0.00 },
                lookupValidator( validations ),
                validations
            )
        } );
        this.send( 'openSidePanel', 'projects/view/return-funds', '', controller, true );
    }
} );
