import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Component.extend( {
    store: Ember.inject.service(),
    tagName: 'div',
    layoutName: 'uber-tags',

    url: function(){
        var modelRoute = Ember.Inflector.inflector.pluralize( this.get( 'model' ) );
        return '/' + modelRoute + '/' + this.get( 'model_id' ) + '/tags';
    }.property( 'model', 'model_id' ),

    change: function( event ){
        this.send( 'addNewTag', event.target.value );
    },

    actions: {
        addNewTag: function( value ){
            var self = this;
            if( !Ember.isEmpty( value ) ){
                if( this.get( 'tags' ).findBy( 'name', value ) === undefined ){
                    var newTag = {
                        name: value.toLowerCase()
                    };
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + self.get( 'url' ),
                        type: 'post',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { uberTag: newTag } )
                    } ).then( function( response ){
                        self.set( 'tagName', null );
                        self.get( 'tags' ).pushObject( self.get( 'store' ).push( 'uber-tag', response.uberTag ) );
                    } );
                }
            }
        },

        deleteTag: function( tag ){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + self.get( 'url' ) + '/' + tag.id,
                type: 'delete'
            } ).then( function(){
                self.set( 'tags', self.get( 'tags' ).removeObject( tag ) );
            } );
        }
    }
} );