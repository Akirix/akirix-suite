import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {
    model: function( params ){
        params[ this.get( 'company_id' ) ] = [];
        params[ this.get( 'wire_instruction_id' ) ] = [];
        return this.findPaged( 'company-wire-instruction', params );

    },
    setupController: function( controller, model ){
        controller.set( 'model', model );
        this.store.findAll( 'wire-instruction' ).then( function( wireInstructions ){
            var options = Ember.A();
            options.pushObject( { label: 'Select A Wire Instruction', val: null } );
            wireInstructions.forEach( function( wireInstruction ){
                options.pushObject( { label: wireInstruction.get( 'name' ), val: wireInstruction.id } );
            } );
            var wireInstructionObj = {
                label: 'Wire Instruction',
                variable: 'wire_instruction_id',
                input_type: 'dropdown',
                options: options
            };
            controller.set( 'searchParams',Ember.A([]));
            controller.get( 'searchParams' ).pushObject( wireInstructionObj );
        } );

    },
    renderTemplate: function(){
        this.render( { outlet: 'panePrimary' } );
    }

} );