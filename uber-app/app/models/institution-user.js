import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.Model.extend( {
    email: DS.attr(),
    first_name: DS.attr(),
    last_name: DS.attr(),
    hash: DS.attr(),
    company_id: DS.attr(),
    phone_mobile: DS.attr(),
    access: DS.attr(),
    status: DS.attr( 'number' ),
    created_at: DS.attr(),
    updated_at: DS.attr(),
    password: DS.attr(),

    str_long_name: function(){
        return this.get( 'first_name' ) + ' ' + this.get( 'last_name' );
    }.property( 'first_name', 'last_name' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' )
} );