import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( registration ){
    var companyName = registration.get( 'company.name' );
    var firstName = registration.get( 'user.first_name' );
    var lastName = registration.get( 'user.last_name' );
    var email = registration.get( 'user.email' );

    var returnString = '';

    if( !Ember.isEmpty( companyName ) ){
        returnString = companyName;
    }
    else if( !Ember.isEmpty( firstName ) && !Ember.isEmpty( lastName ) ){
        returnString = firstName + ' ' + lastName;
    }
    else{
        returnString = email;
    }

    return returnString;
} );