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
        if( Ember.isEmpty( model.project.get( 'snodes' ) ) ){
            model[ 'invoice' ] = this.store.createRecord( 'invoice', {
                project_id: model.project.get( 'id' ),
                currency_id: model.project.get( 'currency_id' ),
                node_id: model.project.get( 'node.id' ),
                documents: Ember.A(),
                invoiceItems: Ember.A(),
                tax_rate: 0.00,
                amount: 0.00,
                type: 0
            } );
        }
        else{
            model[ 'snode' ] = model.project.get( 'snodes' ).objectAt( 0 );
        }
        model[ 'node' ] = model.project.get( 'node' );
        model[ 'toCompany' ] = model.project.get( 'bnode.company' );
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );

        if( Ember.isEmpty( model.project.get( 'snodes' ) ) ){
            let changeset = new Changeset(
                model.invoice,
                lookupValidator( validations ),
                validations,
                { skipValidate: true }
            );
            changeset.save().then( ()=>{
                changeset.set( 'invoiceItems', this.get( 'akxUtil' ).formatEmberWay( model.invoice.get( 'invoiceItems' ), 'invoice-item' ) );
            } );
            controller.set( 'changeset', changeset );
            this.send( 'openSidePanel', 'projects/view/add-invoice', '', controller, true );
        }
        else{
            this.send( 'openSidePanel', 'projects/view/bills', '', controller, true );
        }
        controller.set( 'success', false );
    }
} );
