import Ember from 'ember';

export default Ember.View.extend( {
    layoutName: 'views/list-documents',

    init: function(){
        this.set( 'token', this.get( 'controller.session.access_token' ) );
        this._super();
    }
} );
