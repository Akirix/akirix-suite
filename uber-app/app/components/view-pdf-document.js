import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Component.extend( {
    layoutname: "view-pdf-document",
    needs: [ 'registrations/view' ],
    registrationBinding: 'controllers.registrations/view.model',

    iframe: function(){
        var document = this.get( 'model._id' );

        return config.APP.uber_api_host + '/signupDocuments/' + document + '/stream?token=' + this.get( 'session.access_token' );
    }.property( 'model' )
} );