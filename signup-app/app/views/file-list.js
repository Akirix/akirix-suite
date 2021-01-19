import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.View.extend( {
    templateName: 'views/file-list',
    registrationBinding: 'parentView.controller.model',
    documentsBinding: 'controller.documents',
    hasExemptionBinding: 'controller.hasExemption',
    classNames: [ 'file-list' ],

    actions: {
        remove: function( selectedDocument ){
            var _this = this;
            var adapter = this.get( 'controller.akxAdapter' );
            var registration = this.get( 'registration' );
            var notify = this.get( 'controller.notify' );

            adapter.sendRequest( '/registrations/' + registration._id + '/documents/' + selectedDocument._id, 'delete' )
                .then( function( result ){
                    registration.set( 'documents', registration.documents.rejectBy( '_id', selectedDocument._id ) );
                    registration.notifyPropertyChange( 'documents' );
                } )
                .catch( function(){
                    notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                } );
        }
    }
} );
