import Ember from 'ember';

export default Ember.Component.extend( {
    store: Ember.inject.service(),
    model: null,
    model_id: null,
    title: null,
    description: null,

    init: function(){
        var self = this;
        this._super();
        this.store.find( this.get( 'model' ), this.get( 'model_id' ) ).then( function( item ){
            switch( self.get( 'model' ) ){
                case 'company':
                    self.set( 'title', 'XYZ ' + item.get( 'account_number' ) + ' ' + item.get( 'name' ) );
                    break;
            }
        } );
    }
} );
