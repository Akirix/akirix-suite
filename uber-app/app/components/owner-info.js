import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Component.extend( EmberValidations.Mixin, {

    validations: {
        'owner.name': {
            presence: true
        },
        'owner.date_of_birth': {
            presence: true
        },
        'owner.nationality': {
            presence: true
        },
        'owner.address': {
            presence: true
        },
        'owner.city': {
            presence: true
        },
        'owner.state_province': {
            presence: true
        },
        'owner.postal_code': {
            presence: true
        },
        'owner.country': {
            presence: true
        },
        'owner.percent_ownership': {
            presence: true,
            numericality: {
                greaterThanOrEqualTo: 25,
                lessThanOrEqualTo: 100
            }
        },
        "owner.id_num": {
            presence: true
        },
        "owner.id_type": {
            presence: true
        },
        "owner.id_country": {
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
        this.set( 'owner.hasError', false );
        var ownerErrors = this.get( 'errors.owner' );
        for( var property in ownerErrors ){
            if( ownerErrors.hasOwnProperty( property ) && !Ember.isEmpty( ownerErrors[ property ] ) ){
                this.set( 'owner.hasError', true );
            }
        }
    }.observes( 'validated' ),

    ownerId: function(){
        return this.get( 'idx' ) + 1;
    }.property( 'idx' ),


    init: function(){
        this._super();
    },

    actions: {}
} );
