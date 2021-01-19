import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return Ember.RSVP.hash( {
            project: this.store.find( 'project', params.project_id ),
            endBuyerNode: this.store.find( 'node', { project_id: params.project_id, parent_id: null } ),
        } );
    },

    afterModel: function( model ){
        this._super( ...arguments );
        if( !Ember.isEmpty( model.endBuyerNode ) ){
            model[ 'accountAliases' ] = this.store.find( 'account-alias', { model: 'node', model_id: model.endBuyerNode.objectAt( 0 ).id } );
            model[ 'externalNodes' ] = this.store.find( 'external-node', { node_id: model.endBuyerNode.objectAt( 0 ).id } );
        }
        if( Ember.isEmpty( model.accountAliases ) ){
            model[ 'wireInstructions' ] = this.store.find( 'wire-instruction', { preferred: false } );
        }
        return Ember.RSVP.hash( model );
    },

    setupController: function( controller, model ){
        this._super( ...arguments );

        if( !Ember.isEmpty( model.accountAliases ) ){
            let alias = model.accountAliases.objectAt( 0 );
            this.store.find( 'wire-instruction', alias.get( 'wire_instruction_id' ) ).then( function( instruction ){
                instruction.set( 'account_holder', alias.get( 'company.name' ) );
                instruction.set( 'account_number', alias.get( 'name' ) );
                instruction.set( 'account_iban', alias.get( 'iban' ) );
                model[ 'instruction' ] = instruction;
            } );
        }
        else{
            controller.set( 'accountAlias', {
                name: null,
                iban: null,
                model: null,
                model_id: null,
                account_id: null,
                company_id: null,
                wire_instruction_id: null
            } );    
        }
        
        if( !Ember.isEmpty( model.endBuyerNode ) ){
            controller.set( 'endBuyerNode', model.endBuyerNode.objectAt( 0 ) );
        }
    },

    renderTemplate: function(){
        this.render( 'projects/view', {
            into: 'projects',
            outlet: 'paneSecondary'
        } );
    }

} );