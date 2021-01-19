import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.Component.extend( {
    tagName: 'a',
    type: 'download',
    target: '_blank',
    attributeBindings: [ 'href', 'target' ],
    href: function(){
        return config.APP.signup_api_host + '/documents/' + this.get( 'document_id' ) + '/' + this.get( 'type' ) + '?token=' + this.get( 'token' );
    }.property( 'document_id' )
} );
