import DS from 'ember-data';

export default DS.Model.extend( {
    model: DS.attr(),
    status: DS.attr(),
    rule: DS.attr(),
    name: DS.attr(),
    created_at: DS.attr(),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    ruleObj: function(){
        try{
            return JSON.parse( this.get( 'rule' ) );
        }
        catch( err ){
            return "";
        }
    }.property( 'rule' ),

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' )
} );