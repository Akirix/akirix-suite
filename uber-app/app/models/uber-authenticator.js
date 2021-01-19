import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    name: DS.attr(),
    key: DS.attr(),
    code: DS.attr(),
    status: DS.attr(),
    type: DS.attr(),

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

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' )

} );

