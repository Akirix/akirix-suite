import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.View.extend( {
    layoutName: 'views/upload-document',
    attributeBindings: ['name', 'data-url', 'multiple'],
//    tagName: 'input',
    type: 'file',
    name: 'newDocument',

    'data-url': function(){
        return this.get( 'path' );
    }.property( 'path' ),

    multiple: true,

    watchID: function(  ){
        this.didInsertElement();
    }.observes('model_id', 'model'),

    init: function(){
        this.set( 'token', this.get( 'controller.session.access_token' ) );
        this._super();
    },

    didInsertElement: function(){
        var self = this;
        var store = this.get( 'controller' ).get( 'store' );
        var data = {};
        if( Ember.isEmpty( this.get( 'model_id' ) ) ){
            console.log(data);
            data = {
                model: this.get( 'model' ),
                category: this.get( 'controller' ).get( 'category' ),
                company_id: this.get( 'controller' ).get( 'company_id' ),
                status: 0
            };
        }
        else{
            data = {
                model: this.get( 'model' ),
                company_id: this.get( 'company_id' ),
                category: this.get( 'category'),
                model_id: this.get( 'model_id' ),
                status: 1
            };
        }

        this.$().fileupload( {
            url: config.APP.uber_api_host + '/uberDocuments',
            dataType: 'json',
            formData: data,
            dropZone: false,
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png|pdf|xls|csv|xlsx|doc|docx)$/i,
            start: function( e ){
                Ember.$( '#progress .progress-bar' ).removeClass( 'hide' ).css( 'width', '0' );
            },
            stop: function( e ){
                Ember.$( '#progress .progress-bar' ).addClass( 'hide' ).css( 'width', '0' );
            },
            done: function( e, data ){
                store.find( 'uberDocument', data.result.uberDocument.id ).then( function( newDoc ){
                    self.get( 'documents' ).pushObject( newDoc );
                } );
            },
            progressall: function( e, data ){
                var progress = parseInt( data.loaded / data.total * 100, 10 );
                Ember.$( '#progress .progress-bar' ).css( 'width', progress + '%' );
            }
        } ).prop( 'disabled', false );
    },

    actions: {
        removeDocument: function( document_id ){
            var self = this;
            var store = this.get( 'controller' ).get( 'store' );
            store.find( 'uberDocument', document_id ).then( function( document ){
                document.deleteRecord();
                self.get( 'documents' ).removeObject( document );
                document.save();
            } );
        }
    }
} );