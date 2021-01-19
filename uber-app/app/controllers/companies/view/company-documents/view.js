import Ember from 'ember';

export default Ember.Controller.extend( {
    isImage: function(){
        var type = this.get( 'model.type' );
        var imageTypes = [ 'image/png', 'image/jpg', 'image/jpeg', 'image/gif' ];
        return imageTypes.indexOf( type ) !== -1;
    }.property( 'model.type' ),

    iframeImage: function(){
        var document = this.get( 'model' );
        return '<iframe src="' + document.get( 'url_stream' ) + '?token=' + this.get( 'session.access_token' ) + '" style="width:80%;height:900px;max-width="100%;" frameBorder="0"></iframe>';
    }.property( 'model' ),

    srcUrl: function(){
        var document = this.get( 'model' );
        return document.get( 'url_stream' ) + '?token=' + this.get( 'session.access_token' )
    }.property( 'model' ),

    downloadUrl: function(){
        var document = this.get( 'model' );
        return document.get( 'url_download' ) + '?token=' + this.get( 'session.access_token' );
    }.property( 'model' ),
} );