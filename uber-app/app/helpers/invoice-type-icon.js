import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '<i class="fa fa-file-text-o fa-fw"></i>';
    return new Ember.Handlebars.SafeString( icon );
} );