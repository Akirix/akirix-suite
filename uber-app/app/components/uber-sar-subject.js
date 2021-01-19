import Ember from 'ember';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';


export default Ember.Component.extend( {
    store: Ember.inject.service(),
    taxNumberType: null,

    title: "",

    defaultTitle: "New Subject",

    accountTypes: [
        { label: "Business", val: "business" },
        { label: "Personal", val: "personal" }
    ],

    isBusiness: function(){
        return this.get( 'subject' ).account_type === 'business';
    }.property( 'subject.account_type' ),

    role: [
        { label: "Purchaser/Sender", val: "A" },
        { label: "Payee/Receiver", val: "B" },
        { label: "Both", val: "C" }
    ],

    subjectRole: function(){
        return this.set( 'subject.subject_role', this.get( 'subject_role' ) );
    }.observes( 'subject_role' ),


    isUS: function(){
        return this.get( 'subject' ).country === 'US';
    }.property( 'subject.country' ),

    idTypes: [
        { val: 'SSN/TIN', label: 'Social Security / TIN' },
        { val: 'NID', label: 'National Identification Number' },
        { val: 'EIN', label: 'Employee Identification Number' },
        { val: 'PID', label: 'Passport Identification Number' }
    ],

    showTaxNumberType: function(){
        return this.get( 'subject' ).country === 'US';
    }.property( 'subject.country' ),


    taxNumberTypeOptions: function(){
        if( this.get( 'isBusiness' ) === false ){
            return [
                { value: 'SSN', label: 'SSN' },
                { value: 'TIN', label: 'TIN' },
                { value: 'other', label: 'Other' }
            ];
        }
        else{
            return [
                { value: 'EIN', label: 'EIN' },
                { value: 'other', label: 'Other' }
            ];
        }
    }.property( 'isBusiness' ),


    showTaxAuthorityName: function(){
        return this.get( 'subject' ).tin_type === 'other' || ( this.get( 'subject' ).account_type === 'business' && this.get( 'subject' ).country !== 'US' );
    }.property( 'subject.country', 'subject.tin_type', 'subject.account_type' ),

    taxNumberDidChange: function(){
        var taxNumberType = this.get( 'subject' ).tin_type;
        if( taxNumberType !== 'other' ){
            this.set( this.get( 'subject' ).tin_type, taxNumberType );
        }
        else{
            this.set( this.get( 'subject' ).tin_type, null );
        }
    }.observes( 'subject.tin_type' ),


    init: function(){
        this._super();
        this.getRegistration();
        this.setTitle();
    },

    companyUpdated: function(){
        this.getRegistration();
    }.observes( 'company.id' ),

    setTitle: function(){
        if( this.get( 'subject.account_type' ) === "business" ) {
            var name = this.get('subject.name' );
            if ( !!name ) {
                this.set( 'title', name );
            }
            else{
                this.set( 'title', this.get( 'defaultTitle' ) );
            }
        }
        else{
            var firstName = this.get( 'subject.first_name' );
            var lastName = this.get( 'subject.last_name' );
            if ( ( !!firstName ) && ( !!lastName ) ){
                this.set( 'title', firstName + ' ' + lastName );
            }
            else if( ( !!firstName ) && ( !lastName ) ){
                this.set( 'title', firstName );
            }
            else if( ( !firstName ) && ( !!lastName ) ){
                this.set( 'title', lastName );
            }
            else{
                this.set( 'title', this.get( 'defaultTitle' ) );
            }
        }
    }.observes( 'subject.name', 'subject.first_name', 'subject.last_name', 'subject.account_type' ),

    getRegistration: function(){
        var self = this;
        if( !Ember.isEmpty( self.get( 'company.id' ) ) ){
            self.store.find( 'uber-company-setting', { company_id: self.get( 'company' ).id } ).then( function( uberCompanySetting ){

                if( uberCompanySetting.objectAt( 0 ).get( 'registration_id' ) ){
                    self.get( 'akxUtil' )._sendRequest( '/signupRegistrations/' + uberCompanySetting.objectAt( 0 ).get( 'registration_id' ), 'get' ).then( function( result ){
                        if( result ){
                            var registration = signupModel.create( result.data.registration );

                            self.set( 'subject.account_type', registration.get( 'account_type' ) );
                            self.set( 'subject.address', registration.get( 'company' ).address );
                            self.set( 'subject.postal_code', registration.get( 'company' ).postal_code );
                            self.set( 'subject.state_province', registration.get( 'company' ).state_province );
                            self.set( 'subject.city', registration.get( 'company' ).city );
                            self.set( 'subject.country', registration.get( 'company' ).country );
                            self.set( 'subject.tin', registration.get( 'company' ).tax_num );
                            self.set( 'subject.tin_type', registration.get( 'company' ).tax_num_type );
                            self.set( 'subject.phone', registration.get( 'user' ).phone_mobile );
                            self.set( 'subject.email', registration.get( 'user' ).email );
                            self.set( 'subject.id_type', registration.get( 'user' ).id_type );
                            self.set( 'subject.id_number', registration.get( 'user' ).id_num );
                            self.set( 'subject.id_country', registration.get( 'user' ).id_country );

                            if( self.get( 'subject.account_type' ) === "business" ){
                                self.set( 'subject.name', registration.get( 'company' ).name );
                            }
                            else{
                                self.set( 'subject.first_name', registration.get( 'user' ).first_name );
                                self.set( 'subject.last_name', registration.get( 'user' ).last_name );

                                self.set( 'subject.date_of_birth', (registration.get( 'user' ).date_of_birth).split( 'T' )[ 0 ] );
                            }
                        }
                    } );
                }
                else{
                    self.store.find( 'company', self.get( 'company' ).id ).then( function( company ){

                        var companyData = JSON.parse( JSON.stringify( company ) );

                        self.set( 'subject.account_type', "business" );
                        self.set( 'subject.name', companyData.name );
                        self.set( 'subject.address', companyData.address );
                        self.set( 'subject.postal_code', companyData.postal_code );
                        self.set( 'subject.state_province', companyData.state_province );
                        self.set( 'subject.city', companyData.city );
                        self.set( 'subject.country', companyData.country );
                        self.set( 'subject.phone', companyData.phone );
                        self.set( 'subject.email', companyData.email );

                    } );
                }
            } );
        }
    }
} );
