import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( errorMsg, position ){
    var icon = '';
    var pos = 'right';
    if( !Ember.isEmpty( position ) ){
        pos = position;
    }
    if( !Ember.isEmpty( errorMsg ) ){
        icon = '<span class="hint--' + pos + ' hint--rounded form-control-feedback" data-hint="' + errorMsg + '"><i class="text-gray fa fa-warning fa-fw"></i></span>';
    }
    return new Ember.Handlebars.SafeString( icon );
} );
