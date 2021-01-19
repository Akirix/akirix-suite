import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import { validateNumber } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, {

    model( params ){
        return Ember.RSVP.hash( {
            snode: this.store.findRecord( 'node', params.node_id ),
            fees: this.store.findAll( 'fee' ),
            project: this.modelFor( 'authenticated.projects.view' ).project
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'node' ] = model.project.get( 'node' );
        model[ 'account' ] = model.node.get('account');
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let errorMsg = controller.get( 'stringList.balanceErrorMessage' );
        let amountErrorMessage = controller.get( 'stringList.amountErrorMessage' );

        let allowedPercent = 1 - model.fees.objectAt( 0 ).get( 'fee_invoice_out' );
        let total = Number( model.node.get( 'points_total' ) ) * allowedPercent;
        let used = Number( model.project.get( 'points_out_only' ) );
        let available = Math.max( ( total - used ), 0 );

        let validations = {
            points: [
                validateNumber( { positive: true, allowBlank: true } ),
                ( key, newValue, _, changes )=>{
                    if( !changes.cash ){
                        if(  newValue > available ){
                            return amountErrorMessage
                        }
                        if( newValue === 0 ){
                            return 'Must point funds or cash'
                        }
                        return true;
                    }
                    else{
                        return true;
                    }
                }
            ],
            cash: [
                validateNumber( { positive: true, allowBlank: true } ),
                ( key, newValue, _, changes )=>{
                    if( !changes.points ){
                        if( newValue > model.account.get( 'balance' ) ){
                            return errorMsg
                        }
                        if( newValue === 0 ){
                            return 'Must point funds or cash'
                        }
                        return true;
                    }
                    else{
                        return true;
                    }
                }
            ]
        };

        controller.setProperties( {
            success: false,
            isLocked: false,
            changeset: new Changeset(
                { points: 0.00, cash: 0.00, account_id: model.account.get( 'id' ) },
                lookupValidator( validations ),
                validations
            )
        } );
        this.send( 'openSidePanel', 'projects/view/commit-funds', '', controller, true );
    }
} );
