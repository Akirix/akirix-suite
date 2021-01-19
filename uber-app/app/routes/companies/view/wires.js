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
        params.company_account_number = 'XYZ' + this.modelFor( 'companies.view' ).get( 'account_number' );
        return Ember.RSVP.hash( {
            wire: this.findPaged( 'wire', params ),
            bankRoutes: this.store.findAll( 'bank-route' )
        } );
    },

    setupController( controller, model ){
        controller.set( 'model', model.wire );
        controller.set('company', this.modelFor( 'companies.view' ));
        var options = Ember.A();
        options.pushObject( { label: 'Select Bank Route', val: null } );
        model.bankRoutes.forEach( function( route ){
            options.pushObject( { label: route.get( 'name' ), val: route.id } );
        } );
        var bankRouteObj = {
            label: 'Bank Route',
            variable: 'bank_route_id',
            input_type: 'dropdown',
            options: options
        };
        controller.get( 'searchParams' ).push( bankRouteObj );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wires', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-wires', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Wires';
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
