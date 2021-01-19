import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Component.extend( EmberValidations.Mixin, {

    validations: {
        'executive.name': {
            presence: true
        },
        'executive.position': {
            presence: true
        },
        'executive.date_of_birth': {
            presence: true
        },
        'executive.nationality': {
            presence: true
        },
        'executive.phone': {
            presence: true
        },
        'executive.city': {
            presence: true
        },
        'executive.state_province': {
            presence: true
        },
        'executive.id_country': {
            presence: true
        },
        'executive.id_type': {
            presence: true
        },
        'executive.id_num': {
            presence: true
        }
    },

    idTypes: [
        { key: 'Passport', value: 'Passport' },
        { key: 'SSN/TIN', value: 'Social Security / TIN' },
        { key: 'NID', value: 'National ID' },
        { key: 'Local ID', value: 'Provincial/State ID' }
    ],

    hasErrorCheck: function(){
        this.set( 'executive.hasError', false );
        var executiveErrors = this.get( 'errors.executive' );
        for( var property in executiveErrors ){
            if( executiveErrors.hasOwnProperty( property ) && !Ember.isEmpty( executiveErrors[ property ] ) ){
                this.set( 'executive.hasError', true );
            }
        }
    }.observes( 'validated' ),

    executiveId: function(){
        return this.get( 'idx' ) + 1;
    }.property( 'idx' ),

    moreThanOne: function(){
        return ( this.get( 'executives.length' ) > 1 );
    }.property( 'executives.length' ),

    init: function(){
        this._super();
    },

    actions: {
        removeSelf: function(){
            this.get( 'executives' ).removeObject( this.get( 'executive' ) );
        }
    }
} );
