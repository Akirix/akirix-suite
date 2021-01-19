import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {
    dateVar: 'updated_at',

    model: function( params ){
        params[ this.get( 'dateVar' ) ] = [];
        params[ this.get( 'dateVar' ) ].push( Ember.get( params, 'period_from' ) );
        params[ this.get( 'dateVar' ) ].push( Ember.get( params, 'period_to' ) );
        params.company_id = this.modelFor( 'companies.view' ).get( 'id' );
        return this.findPaged( 'fx-request', params );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/fx-requests', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-fx', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Foreign Exchange';
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