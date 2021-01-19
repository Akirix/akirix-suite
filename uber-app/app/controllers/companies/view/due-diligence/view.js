import Ember from 'ember';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend(  {
    needs: [ 'application' ],

    downloadUrl: function(){
        var dd = this.get( 'model' );
        return dd.get( 'url_download' ) + '?token=' + this.get( 'session.access_token' );
    }.property( 'model' ),

    actions: {
    }
} );


