
import Ember from 'ember';
import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    name: DS.attr(),
    notes: DS.attr(),
    publish_from: DS.attr(),
    publish_to: DS.attr(),


    str_publish_from: function(){
        return moment( this.get( 'publish_from' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'publish_from' ),

    str_publish_to: function(){
        return moment( this.get( 'publish_to' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'publish_to' )

});