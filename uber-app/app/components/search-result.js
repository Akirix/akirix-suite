import Ember from "ember";
import Util from 'ember-cli-pagination/util';
import PageItems from 'ember-cli-pagination/lib/page-items';
import config from 'uber-app/config/environment';
import signupModel from 'uber-app/models/signup-registration';


export default Ember.Component.extend( {
    items: null,
    page: 1,
    totalPages: 10,

    pageItemsObj: function(){
        return PageItems.create( {
            parent: this,
            currentPageBinding: "parent.page",
            totalPagesBinding: "parent.totalPages",
            truncatePagesBinding: "parent.truncatePages",
            numPagesToShowBinding: "parent.numPagesToShow",
            showFLBinding: "parent.showFL"
        } );
    }.property( 'parent.page', 'parent.totalPages' ),


    init: function(){
        this._super();
        this.set( 'layoutName', this.get( 'template' ) );
    },

    didInsertElement: function(){
        this._super();
        this.performSearch();
    },

    performSearch: function(){
        var self = this;
        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + self.get( 'endpoint' ) + '?value=' + self.get( 'searchValue' ) + '&page=' + self.get( 'page' ) + '&per_page=' + self.get( 'per_page' ),
                type: 'GET'
            } ).then(
                function( response ){
                    if( !Ember.hasOwnProperty( response[ self.get( 'itemName' ) ] ) ){
                        //self.set( 'items', response[ self.get( 'itemName' ) ] );

                        self.set( 'page', self.get( 'page' ) );
                        self.set( 'perPage', self.get( 'per_page' ) );
                        self.set( 'totalPages', response.meta.total_pages );

                        var inflector = new Ember.Inflector( Ember.Inflector.defaultRules );
                        var singularName = inflector.singularize( self.get( 'itemName' ) );
                        var itemObjs = [];
                        var models = [];

                        response[ self.get( 'itemName' ) ].forEach( function( item ){
                            if( self.get( 'itemName' ) === 'registrations' ){
                                itemObjs.push( signupModel.create( item ) );

                            } else{
                                itemObjs.push( self.store.push( singularName, self.store.normalize( singularName, item ) ) );
                            }
                        } );
                        self.set( 'items', itemObjs );
                    }
                    else{
                        self.set( 'items', [] );
                        self.set( 'totalPages', 0 );
                    }
                },
                function( xhr, status, error ){
                }
            );
        } );
    }.observes( 'searchValue', 'page', 'perPage' ),

    pageItems: function(){
        return this.get( "pageItemsObj.pageItems" );
    }.property( "pageItemsObj.pageItems", "pageItemsObj" ),

    canStepForward: (function(){
        var page = Number( this.get( "page" ) );
        var totalPages = Number( this.get( "totalPages" ) );
        return page < totalPages;
    }).property( "page", "totalPages" ),

    canStepBackward: (function(){
        var page = Number( this.get( "page" ) );
        return page > 1;
    }).property( "page" ),

    actions: {
        pageClicked: function( number ){
            Util.log( "PageNumbers#pageClicked number " + number );
            this.set( "page", number );
            this.set( "per_page", this.get( 'per_page' ) );
            this.performSearch();
            this.sendAction( 'action', number );
        }
        ,
        incrementPage: function( num ){
            var page = Number( this.get( "page" ) ),
                totalPages = Number( this.get( "totalPages" ) );

            if( page === totalPages && num === 1 ){
                return false;
            }
            if( page <= 1 && num === -1 ){
                return false;
            }
            this.incrementProperty( 'page', num );

            var newPage = this.get( 'page' );
            this.sendAction( 'action', newPage );
        }
    }
} )
;
