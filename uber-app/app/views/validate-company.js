import Ember from 'ember';

export default Ember.View.extend( {
    layoutName: 'views/validate-company',
    //templateName: 'views/validate-company',
    shouldRun: true,
    found: false,
    status: 1,

    init: function(){
        this._super();
        this.set( 'content', null );
    },

    getCompany: function(){
        var self = this;
        if( this.get( 'account_number' ) !== this.get( 'current_company_account' ) ){
            var store = this.get( 'controller' ).get( 'store' );
            store.find( 'company', { account_number: this.get( 'account_number' ), status: this.get( 'status' ) } ).then( function( companies ){
                if( companies.get( 'length' ) === 1 ){
                    self.set( 'content', 'XYZ' + self.get( 'account_number' ) + ' ' + companies.objectAt( 0 ).get( 'name' ) );
                    self.set( 'found', true );
                    self.set( 'company_id', companies.objectAt( 0 ).get( 'id' ) );
                }
                else{
                    self.set( 'company_id', "" );
                    self.set( 'content', 'No valid Company Found for XYZ' + self.get( 'account_number' ) );
                    self.set( 'found', false );
                }
            } );
        }
        else{
            self.set( 'content', 'Cannot be self' );
            self.set( 'found', false );
        }
    },

    valueChanged: function(){
        this.set( 'content', null );
        this.getCompany();
    }.observes( 'account_number', 'company_id' ),

    reset: function(){
        if( this.get( 'found' ) === null ){
            this.set( 'content', null );
            this.set( 'account_number', null );
            this.set( 'company_id', null );
            this.set( 'current_company_account', null );
            this.set( 'status', 1 );
        }
    }.observes( 'found' ),

    actions: {}
} );
