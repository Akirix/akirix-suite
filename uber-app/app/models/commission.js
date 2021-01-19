import DS from 'ember-data';

export default DS.Model.extend( {
    affiliate_id: DS.attr(),
    company_id: DS.attr(),

    rate: DS.attr( 'Number' ),
    start_date: DS.attr(),
    end_date: DS.attr(),
    status: DS.attr( 'Number' ),

    company: DS.belongsTo( 'company', { async: true } ),
    affiliate: DS.belongsTo( 'company', { async: true } ),

    str_rate: function(){
        return math.round( Number( this.get( 'rate' ) ) * 100, 2 ) + '%';
    }.property( 'rate' ),

    str_start_date: function(){
        return moment( this.get( 'start_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'start_date' ),

    str_end_date: function(){
        return moment( this.get( 'end_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'end_date' )
} );

