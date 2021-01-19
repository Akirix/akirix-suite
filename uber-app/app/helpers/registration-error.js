import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( level ){
    var html;
    if( level === 0 ){
        html = '<i class="fa fa-times-circle text-danger"></i>';
    }
    else if( level === 1 ){
        html = '<i class="fa fa-exclamation-triangle text-yellow"></i>';
    }
    else{
        html = '<i class="fa fa-times-flag text-blue"></i>';
    }

    return new Ember.Handlebars.SafeString( html );
} );
