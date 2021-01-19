import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view' ],
    registrationBinding: 'controllers.registrations/view.model',

    isImage: function(){
        var type = this.get( 'model.document.type' );
        var imageTypes = [ 'image/png', 'image/jpg', 'image/jpeg', 'image/gif' ];
        return imageTypes.indexOf( type ) !== -1;
    }.property( 'model.type' ),

    iframe: function(){
        var document = this.get( 'model.document' );
        return '<iframe src="https://docs.google.com/viewer?embedded=true&url=' + config.APP.uber_api_host +
            '/signupDocuments/' + document._id + '/stream?token=' + this.get( 'session.access_token' ) +
            '" style="width:100%;height:700px;" frameBorder="0"></iframe>';
    }.property( 'model' ),

    srcUrl: function(){
        var document = this.get( 'model.document' );
        return 'data:' + document.type + ';base64,' + document.data;
    }.property( 'model' ),

    downloadUrl: function(){
        var document = this.get( 'model.document' );
        return config.APP.uber_api_host + '/signupDocuments/' + document._id + '/download?token=' + this.get( 'session.access_token' );
    }.property( 'model' ),

    registrationDocumentWatcher: function(){
        this.get( 'registration' ).notifyPropertyChange( 'documents' );
    }.observes( 'model.registrationDocument.verified' ),

    actions: {
        save: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );
            var registrationDocument = this.get( 'model.registrationDocument' );

            _this.set( 'isLocked', true );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/updateDocument', 'put', {
                sub_document_id: registrationDocument._id,
                document: registrationDocument
            } ).then( function( result ){
                _this.set( 'isLocked', false );
            }, function(){
                _this.set( 'isLocked', false );
            } );
        }
    }
} );

