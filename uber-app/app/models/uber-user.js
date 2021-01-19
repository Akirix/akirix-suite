import DS from 'ember-data';

export default DS.Model.extend( {
    email: DS.attr(),
    first_name: DS.attr(),
    last_name: DS.attr(),
    password: DS.attr(),
    phone_mobile: DS.attr(),
    name: function(){
        return this.get( 'first_name' ) + ' ' + this.get( 'last_name' );
    }.property( 'first_name', 'last_name' )
} );

