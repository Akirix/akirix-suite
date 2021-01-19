import DS from 'ember-data';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );

export default DS.Model.extend( {

    created_at: DS.attr(),
    updated_at: DS.attr(),

    status: DS.attr( 'number' ),
    type: DS.attr( 'number' ),
    uber_sar_report_id: DS.attr(),
    reference: DS.attr(),
    confirmation: DS.attr(),

    str_updated_at: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_created_at: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

} );
