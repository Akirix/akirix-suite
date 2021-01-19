import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( option ){
    var icon = '';
    if( option ){
        icon = '<i class="fa fa-check-square-o fa-fw"></i>';
    }
    else{
        icon = '<i class="fa fa-square-o fa-fw"></i>';
    }
    return new Ember.Handlebars.SafeString( icon );
} );