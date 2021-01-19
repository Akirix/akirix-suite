import DS from 'ember-data';

export default DS.Model.extend( {
    user_id: DS.attr(),
    uber_user_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    notes: DS.attr(),
    ticket_id: DS.attr(),

    uberUser: DS.belongsTo( 'uber-user', { async: true } ),
    user: DS.belongsTo( 'user', { async: true } ),
    ticket: DS.belongsTo( 'ticket', { async: true } ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_created_at_time: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'created_at' ),

    str_updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_updated_at_time: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'updated_at' ),

} );
