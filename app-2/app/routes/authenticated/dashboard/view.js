import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import shareValidations from 'akx-app/validations/send-invite';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            account: this.store.peekRecord( 'account', params.account_id ),
            wireInstructions: this.store.findAll( 'wire-instruction' ),
            invite: { name: null, company_name: null, email: null },
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'preferredWireInstructions' ] = this.store.query( 'wire-instruction', { preferred: true } );
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        this.send( 'openSidePanel', 'dashboard.view', '', controller );
        controller.set( 'changeset', new Changeset(
            model.invite,
            lookupValidator( shareValidations ),
            shareValidations,
            { skipValidate: true }
        ) );
    }
} );
