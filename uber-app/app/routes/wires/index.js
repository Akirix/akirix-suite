import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {
    dateVar: 'updated_at',
    amount: 'amount',

    model: function( params ){
        params[ this.get( 'dateVar' ) ] = [];
        params[ this.get( 'amount' ) ] = [];
        params[ this.get( 'dateVar' ) ].push( Ember.get( params, 'period_from' ) );
        params[ this.get( 'dateVar' ) ].push( Ember.get( params, 'period_to' ) );
        params[ this.get( 'amount' ) ].push( Ember.get( params, 'amount_min' ) );
        params[ this.get( 'amount' ) ].push( Ember.get( params, 'amount_max' ) );
        return Ember.RSVP.hash( {
            wire: this.findPaged( 'wire', params ),
            bankRoutes: this.store.findAll( 'bank-route' ),
            locations: this.store.find( 'location', { type: 0 } )
        } );
    },

    setupController( controller, model ){
        controller.set( 'model', model.wire );
        var searchParams = controller.get( 'searchParams' );
        this.addOptions( searchParams, 'bank_country', 'Select Country', model.locations, 'name', 'abbreviation' );
        this.addOptions( searchParams, 'bank_route_id', 'Select Bank Route', model.bankRoutes, 'name', 'id' );
    },
    
    addOptions: function( searchParams, variable, defaultOption, items, labelNode, valNode ){
        var options = Ember.A( [ { label: defaultOption, val: null } ] );
        items.forEach( function( item ){
            options.pushObject( { label: item.get( labelNode ), val: item.get( valNode ) } );
        } );
        Ember.set( searchParams.findBy( 'variable', variable ), 'options', options );
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
