import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    isImage: function(){
        var type = this.get( 'model.type' );
        var imageTypes = [ 'image/png', 'image/jpg', 'image/jpeg', 'image/gif' ];
        return imageTypes.indexOf( type ) !== -1;
    }.property( 'model.type' ),

    iframe: function(){
        var document = this.get( 'model' );
        return '<iframe src="https://docs.google.com/viewer?embedded=true&url=' + document.get( 'url_stream' ) + '?token=' + this.get( 'session.access_token' ) + '" style="width:100%;height:700px;" frameBorder="0"></iframe>';
    }.property( 'model' ),

    iframeImage: function(){
        var document = this.get( 'model' );
        return '<iframe src="' + document.get( 'url_stream' ) + '?token=' + this.get( 'session.access_token' ) + '" style="width:100%;height:700px;" frameBorder="0"></iframe>';
    }.property( 'model' ),

    downloadUrl: function(){
        var document = this.get( 'model' );
        return document.get( 'url_download' ) + '?token=' + this.get( 'session.access_token' );
    }.property( 'model' ),

    actions: {}

} );