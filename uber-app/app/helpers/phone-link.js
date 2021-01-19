import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value ){
    if( !Ember.isEmpty( value ) ){
        return new Ember.Handlebars.SafeString( '<a href="tel:' + value + '" target="_blank">' + value + '</a>' );
    }
    else{
        return '';
    }
} );