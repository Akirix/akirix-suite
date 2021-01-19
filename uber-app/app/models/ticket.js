import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    company_id: DS.attr(),
    uber_user_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    title: DS.attr(),
    name: DS.attr(),
    status: DS.attr( 'number' ),
    priority: DS.attr(),

    company: DS.belongsTo( 'company', { async: true } ),
    uberUser: DS.belongsTo( 'uber-user', { async: true } ),
    ticket_messages: DS.hasMany( 'ticket-message', { async: true } ),

    isPending: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isClosed: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' )

} );