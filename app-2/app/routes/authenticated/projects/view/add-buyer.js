import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import buyerValidations from 'akx-app/validations/add-buyer';
import { validatePresence, validateNumber } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, {

    model(){
        return Ember.RSVP.hash( {
            fees: this.store.findAll( 'fee' ),
            project: this.modelFor( 'authenticated.projects.view' ).project
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'fee' ] = model.fees.objectAt( 0 );
        model[ 'node' ] = model.project.get( 'node' );
        model[ 'node_items' ] = model.project.get( 'node.node_items' );
        model[ 'externalNodes' ] = this.store.query( 'external-node', { node_id: model.project.get( 'node.id' ) } );
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );

        if( model.project.get( 'isSmart' ) && model.project.get( 'fixed_profit_margin' ) === 0 ){
            if( !model.project.get( 'hasNoSupplier' ) ){
                buyerValidations.discount_rate.push(
                    validatePresence( true ),
                    validateNumber( { gt: 0, lte: 100, positive: true, allowBlank: true } )
                );
            }
        }
        let changeset = new Changeset( {
                account_number: '',
                currency_id: model.project.get( 'currency_id' ),
                discount_rate: model.project.get( 'node.discount_rate' ) || 0,
                is_external: false,
                name: null,
                point_of_contact: null,
                phone: null,
                email: null
            },
            lookupValidator( buyerValidations ),
            buyerValidations
        );
        let nodeItems = [];
        if( !Ember.isEmpty( model.node_items ) ){
            model.node_items.forEach( ( item )=>{
                nodeItems.push( item );
            } );
        }
        controller.setProperties( {
            success: false,
            documents: Ember.A(),
            nodeItems: Ember.A( nodeItems ),
            changeset: changeset,
            externalNodes: model.externalNodes
        } );
        this.send( 'openSidePanel', 'projects/view/add-buyer', '', controller, true );
    }
} );
