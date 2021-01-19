import Ember from 'ember';

export default Ember.Helper.helper( function( [ wireStateProvince, states, wireCountry ] ){
    if( wireCountry === 'US' ){
        let stateFound = states.findBy( 'abbreviation', wireStateProvince );
        if( Ember.isEmpty( stateFound ) ){
            return wireStateProvince;
        }
        return stateFound.get( 'name' );
    }
    return wireStateProvince;
} );