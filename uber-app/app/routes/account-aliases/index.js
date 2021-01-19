import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {
    model: function( params ){
        return Ember.RSVP.hash( {
            accountAlias: this.findPaged( 'account-alias', params ),
            wireInstructions: this.store.findAll( 'wire-instruction' )
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model.accountAlias );
        var options = Ember.A( [ { label: 'Select Bank', val: null } ] );
        model.wireInstructions.forEach( function( wireInstruction ){
            options.pushObject( { label: wireInstruction.get( 'name' ), val: wireInstruction.get( 'id' ) } );
        } );
        Ember.set( controller.get( 'searchParams' ).findBy( 'variable', 'wire_instruction_id' ), 'options', options );
    },

    renderTemplate: function( controller, model ){
        this.render( { outlet: 'panePrimary' } );
    },

    resetController: function( controller ){
        var queryParams = controller.get( 'queryParams' );
        var exceptions = [ 'page', 'perPage' ];
        queryParams.forEach( function( param ){
            if( exceptions.indexOf( param ) === -1 ){
                controller.set( param, null );
            }
        } );
    }
} );