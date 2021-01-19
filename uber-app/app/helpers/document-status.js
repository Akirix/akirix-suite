import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( document ){
    var html;
    if( document.hasOwnProperty( 'verified' ) && document.verified === true ){
        html = '<i class="fa fa-check-square-o text-green-dark"></i>';
    }
    else{
        html = '<i class="fa fa-square-o"></i>';
    }
    return new Ember.Handlebars.SafeString( html );
} );