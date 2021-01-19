import DS from 'ember-data';

export default DS.Model.extend( {
    question: DS.attr(),
    answer: DS.attr(),
    user_id: DS.attr(),
    company_id: DS.attr(),
    type: DS.attr(),
    created_at: DS.attr(),
    updated_at: DS.attr(),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' )
} );