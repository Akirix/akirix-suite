import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    model: DS.attr(),
    model_id: DS.attr(),
    type: DS.attr(),
    title: DS.attr(),
    status: DS.attr(),
    response: DS.attr(),
    deadline: DS.attr(),
    notes: DS.attr(),

    str_created_at: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_deadline: function(){
        return moment( this.get( 'deadline' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'deadline' ),

    isDocument: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isText: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isTerms: function(){
        return this.get( 'type' ) === 2;
    }.property( 'type' ),

    overDueDeadline: function(){
        return this.get( 'deadline' ) < new Date();
    }.property( 'deadline' ),

    isPending: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' )
} );