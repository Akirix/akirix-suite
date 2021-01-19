import DS from 'ember-data';

export default DS.Model.extend( {
    user_id: DS.attr(),
    verify: DS.attr(),
    code: DS.attr(),
    type: DS.attr(),
    expires: DS.attr(),
    status: DS.attr(),

    str_expiration_date: function(){
        return moment( this.get( 'expires' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'expires' ),

    str_expiration_time: function(){
        return moment( this.get( 'expires' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'expires' ),

    isSms: function(){
        return this.get( 'type' ) === "0";
    }.property( 'type' ),
    
    isPasswordReset: function(){
        return this.get( 'type' ) === "1";
    }.property( 'type' )
} );