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
    }.property( 'deadline' )
} );