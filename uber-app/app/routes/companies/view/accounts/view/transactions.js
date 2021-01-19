import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';


export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {
    dateVar: 'updated_at',

    model: function( params ){
        params.account_id = this.modelFor( 'companies.view.accounts.view' ).get( 'id' );
        params[ this.get( 'dateVar' ) ] = [];
        params[ this.get( 'dateVar' ) ].push( Ember.get( params, 'period_from' ) );
        params[ this.get( 'dateVar' ) ].push( Ember.get( params, 'period_to' ) );
        params[ 'status' ] = 1;
        params['dailyBalance'] = 1;
        return this.findPaged( 'transaction', params );
    },

    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'account_id', this.modelFor( 'companies.view.accounts.view' ).get( 'id' ) );
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/accounts/transactions', {
            into: 'companies/view',
            outlet: 'companyPrimary'
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


