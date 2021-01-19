import Ember from 'ember';
import config from 'uber-app/config/environment';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        var self = this;
        return Ember.RSVP.Promise.all( [
            Ember.$.get( config.APP.uber_api_host + '/wireInstructions', { company_id: self.modelFor( 'companies.view' ).get( 'id' ), preferred: true } ),
            Ember.$.get( config.APP.uber_api_host + '/wireInstructions', { company_id: self.modelFor( 'companies.view' ).get( 'id' ) } )
        ] ).then( function( result ){
            var wireInstructions = Ember.A();

            result[ 0 ].wireInstructions.forEach( function( item, index ){
                result[ 0 ].wireInstructions[ index ].type = 'Preferred';
                result[ 0 ].wireInstructions[ index ].preferred = true;
                wireInstructions.push( self.store.push( 'wire-instruction', self.store.normalize( 'wire-instruction', result[ 0 ].wireInstructions[ index ] ) ) );
            } );
            result[ 1 ].wireInstructions.forEach( function( item, index ){
                result[ 1 ].wireInstructions[ index ].type = 'Standard';
                result[ 1 ].wireInstructions[ index ].preferred = false;
                wireInstructions.push( self.store.push( 'wire-instruction', self.store.normalize( 'wire-instruction', result[ 1 ].wireInstructions[ index ] ) ) );
            } );
            return wireInstructions;
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wire-instructions', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-company', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },
    activate: function(){
    },

    actions: {}
} );
