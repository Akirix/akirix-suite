import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value ){
    if( !Ember.isEmpty( value ) ){
        return new Ember.Handlebars.SafeString( '<a href="mailto:' + value + '" target="_blank">' + value + '</a>' );
    }
    else{
        return '';
    }
} );