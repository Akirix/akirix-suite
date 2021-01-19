import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.Model.extend( {
    model: DS.attr(),
    model_id: DS.attr(),
    raw_data: DS.attr(),
    status: DS.attr(),
    reason: DS.attr(),
    updated_at: DS.attr(),
    created_at: DS.attr(),
    uberUser: DS.belongsTo( 'uber-user', { async: true } ),

    str_updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_updated_at_time: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'updated_at' ),

    isConfirmed: function( ){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isPending: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isRejected: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' )
} );

