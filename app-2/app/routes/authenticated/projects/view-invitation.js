import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import { validatePresence, validateInclusion } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {

    model( params ){
        let results = {
            node: this.store.findRecord( 'node', params.node_id )
        }

        return this.store.findRecord( 'project', params.project_id ).then( ( project )=>{
            results[ 'project' ] = project;
            results[ 'snodes' ] = project.get( 'snodes' );

            return Ember.RSVP.hash( results );
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'documents' ] = model.project.get( 'documents' );
        model[ 'accounts' ] = this.store.query( 'account', { currency_id: model.project.get( 'currency_id' ) } );

        if( Ember.isEmpty( model.node.get( 'parent_id' ) ) ){
            const snode = model.snodes.objectAt( 0 );
            model[ 'nodeItems' ] = snode.get( 'nodeItems' );
            model[ 'nodeDocuments' ] = this.store.query( 'document', {
                model: 'node',
                model_id: snode.id
            } );
        }
        else{
            model[ 'nodeDocuments' ] = this.store.query( 'document', {
                model: 'node',
                model_id: model.node.id
            } );
            model[ 'nodeItems' ] = model.node.get( 'node_items' );
        }
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let validations = {
            account_id: validatePresence( true ),
            akx_agreement: validateInclusion( { list: [ true ] } ),
            akx_terms: validateInclusion( { list: [ true ] } )
        };

        let changeset = new Changeset(
            model.node,
            lookupValidator( validations ),
            validations,
            { skipValidate: true }
        );
        changeset.set( 'akx_agreement', false );
        changeset.set( 'akx_terms', false );
        controller.set( 'changeset', changeset );
        this.send( 'openSidePanel', 'projects/view-invitation', '', controller );
    }
} );
