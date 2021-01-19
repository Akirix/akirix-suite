import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    name: DS.attr(),
    title: DS.attr(),
    description: DS.attr(),
    user_id: DS.attr(),
    user_email: DS.attr(),
    domain: DS.attr(),
    source: DS.attr(),
    added_date: DS.attr(),
    breached_date: DS.attr(),
    data_classes: DS.attr(),
    type: DS.attr( 'number' ),

    isBreached: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isPasted: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),


    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_breached: function(){
        return moment( this.get( 'breached_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'breached_date' ),

    str_added: function(){
        return moment( this.get( 'added_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'added_date' )


} );