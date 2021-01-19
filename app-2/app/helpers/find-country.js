import Ember from 'ember';

export default Ember.Helper.helper( function( [ country, countries ] ){
    let countryFound = countries.findBy( 'abbreviation', country );
    if( Ember.isEmpty( countryFound ) ){
        return country;
    }
    return countryFound.get( 'name' );
} );