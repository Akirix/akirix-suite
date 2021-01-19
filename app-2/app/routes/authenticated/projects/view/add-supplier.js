import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import supplierValidations from 'akx-app/validations/add-supplier';
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
        model[ 'node_items' ] = model.project.get( 'node.node_items' );
        model[ 'fee' ] = model.fees.objectAt( 0 );
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        if( model.project.get( 'isSmart' ) && model.project.get( 'fixed_profit_margin' ) === 0 ){
            if( !model.project.get( 'hasNoBuyer' ) ){
                supplierValidations.discount_rate.push(
                    validatePresence( true ),
                    validateNumber( { gt: 0, lte: 100, positive: true, allowBlank: true } )
                );
            }
        }

        let changeset = new Changeset( {
                account_number: '',
                currency_id: model.project.get( 'currency_id' ),
                discount_rate: model.project.get( 'node.discount_rate' ) || 0,
            },
            lookupValidator( supplierValidations ),
            supplierValidations
        );

        let nodeItems = [];

        if( !Ember.isEmpty( model.node_items ) ){
            model.node_items.forEach( ( item )=>{
                let newItem = this.get( 'store' ).createRecord( 'node-item', {
                    name: item.get( 'name' ),
                    price: item.get( 'price' ),
                    project_id: model.project.id,
                    node_id: null
                } );
                nodeItems.push( newItem );
            } );
        }
        controller.setProperties( {
            success: false,
            documents: Ember.A(),
            nodeItems: Ember.A( nodeItems ),
            changeset: changeset
        } );
        this.send( 'openSidePanel', 'projects/view/add-supplier', '', controller, true );
    }
} );
