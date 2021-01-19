import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return {
            prefix: null,
            length: null,
            range_min: null,
            range_max: null,
            company_id: null,
            company: null,
            wire_instruction_id: null
        };
    },
    
    setupController: function( controller, model ){
    	var self = this;
    	
    	this.store.find( 'wire-instruction' ).then( function( wireInstructions ){
    		controller.set( 'wireInstructions', wireInstructions );
    	} );
    
    	controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'account-alias-rules/add', {
            into: 'account-alias-rules',
            outlet: 'paneSecondary'
        } );
    }
} );

