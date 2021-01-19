import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import validations from 'akx-app/validations/project-invoices';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    model(){
        return Ember.RSVP.hash( {
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
            fromCompany: this.get( 'session.data.authenticated.company' ),
            project: this.modelFor( 'authenticated.projects.view' ).project
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'node' ] = model.project.get( 'node' );
        model[ 'toCompany' ] = model.project.get( 'bnode.company' );
        model[ 'invoice' ] = this.store.createRecord( 'invoice', {
            tax_rate: 0.00,
            project_id: model.project.get( 'id' ),
            currency_id: model.project.get( 'currency_id' ),
            node_id: model.project.get( 'node.id' ),
            invoiceItems: Ember.A(),
            documents: Ember.A(),
            amount: 0.00,
            type: 0
        } ).save();
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );

        let changeset = new Changeset(
            model.invoice,
            lookupValidator( validations ),
            validations,
            { skipValidate: true }
        );

        controller.setProperties( {
            success: false,
            changeset: changeset
        } );
        this.send( 'openSidePanel', 'projects/view/add-invoice', '', controller, true );
    }
} );
