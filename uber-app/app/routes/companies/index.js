import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {

    model: function( params ){
    	return Ember.RSVP.hash( {
            company: this.findPaged( 'company', params ),
            locations: this.store.find( 'location', { type: 0 } )
        } );
    },

    setupController: function( controller, model ){
        model.company.forEach( function( company ){
            company.set( 'aliases', controller.store.find( 'account-alias', { company_id: company.id } ) );
            company.set( 'companyRelationships', controller.store.find( 'company-relationship', { company_id: company.id } ) );
        } );
        controller.set( 'model', model.company );
        var options = Ember.A( [ { label: 'Select Country', val: null } ] );
        model.locations.forEach( function( location ){
            options.pushObject( { label: location.get( 'name' ), val: location.get( 'abbreviation' ) } );
        } );
        Ember.set( controller.get( 'searchParams' ).findBy( 'variable', 'country' ), 'options', options );
    },

    renderTemplate: function( controller, model ){
        this.render( { outlet: 'panePrimary' } );
        this.render( 'pane-secondary', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
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