import Ember from 'ember';

export default Ember.Component.extend( {
    store: Ember.inject.service(),

    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.find-company' ) );
    }.on( 'init' ),
    attributeBindings: ['name'],

    getCompany: function(){
        if( this.get( 'akirixAccountNumber' ).length > 4 ){
            this.get( 'store' ).query( 'company', { account_number: this.get( 'akirixAccountNumber' ) } ).then( ( companies )=>{
                if( Ember.isEmpty( companies ) ){
                    this.setProperties( {
                        errors: [ this.get( 'stringList.errorMsg' ) ],
                        companyFound: false
                    } );
                }
                else{
                    var company = companies.objectAt( 0 );
                    if( company.get( 'id' ) === this.get( 'companyId' ) ){
                        this.setProperties( {
                            errors: [ this.get( 'stringList.sameCompany' ) ],
                            value: null,
                            companyFound: false
                        } );
                    }
                    else{
                        this.setProperties( {
                            errors: [],
                            value: Ember.get( company, this.get( 'path' ) ),
                            validCompany: company,
                            companyFound: true
                        } );
                    }
                }
            } ).catch( ( err )=>{
                this.sendAction( 'error', err );
            } );
        }
        else {
            this.setProperties( {
                errors: [],
                companyFound: false,
                value: ''
            } );
        }
    }.observes( 'akirixAccountNumber' ),

    isValidObs: function(){
        if( !this.get( 'changeset.isValid' ) ){
            this.setProperties( {
                errors: this.get( 'changeset.error.account_number.validation' ),
                value: null,
                companyFound: false
            } );
        }
    }.observes( 'changeset.isValid')
} );
