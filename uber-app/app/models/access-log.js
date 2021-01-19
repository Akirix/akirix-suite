import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    ip: DS.attr(),
    user_id: DS.attr(),
    service_provider: DS.attr(),
    city: DS.attr(),
    state: DS.attr(),
    country: DS.attr(),
    longitude: DS.attr(),
    latitude: DS.attr(),
    timezone: DS.attr(),
    user_agent: DS.attr(),
    browser: DS.attr(),
    browser_version: DS.attr(),
    os: DS.attr(),
    os_version: DS.attr(),
    device: DS.attr(),
    status: DS.attr(),
    user: DS.belongsTo( 'user', { async: true } ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_created_at_time: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'created_at' )
} );