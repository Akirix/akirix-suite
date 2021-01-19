import Ember from "ember";
import config from 'uber-app/config/environment';
import Notify from 'ember-notify';

export default Ember.Component.extend( {
    access: null,
    accessArray: null,

    init: function(){
        this._super();
        this.newAccess();
    },

    newAccess: function(){
        this._super();
        var self = this;
        var access_json = JSON.parse( this.get( 'access' ) );
        this.set( 'access_json', access_json );
        this.set( 'accessArray', Ember.$.map( access_json, function( v, i ){
            var obj = {};
            obj[ 'name' ] = i;
            obj[ 'value' ] = v;
            return obj;
        } ) );
    }.observes( 'access' ),

    accessUpdated: function(){
        var tempObj = {};
        Ember.$.map( this.get( 'accessArray' ), function( item ){
            tempObj[ item.name ] = item.value;
        } );
        Ember.set( this, 'access', JSON.stringify( tempObj ) );
    }.observes( 'accessArray.@each.value' ),

    actions: {}

} );