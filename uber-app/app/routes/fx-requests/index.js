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
        return this.findPaged( 'fx-request', params );
    },


    renderTemplate: function( controller, model ){
        this.render( 'fx-requests/index', {
            into: 'fx-requests',
            outlet: 'panePrimary'
        } );

        this.render( 'fx-requests/help-index', {
            into: 'fx-requests',
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