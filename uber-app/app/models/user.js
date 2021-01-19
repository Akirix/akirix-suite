import DS from 'ember-data';

export default DS.Model.extend( {
    company_id: DS.attr(),

    status: DS.attr('number'),
    email: DS.attr(),
    first_name: DS.attr(),
    last_name: DS.attr(),
    password: DS.attr(),
    phone_mobile: DS.attr(),
    access: DS.attr(),
    account_owner: DS.attr('number'),
    company: DS.belongsTo( 'company', { async: true } ),

    name: function(){
        return this.get( 'first_name' ) + ' ' + this.get( 'last_name' );
    }.property( 'first_name', 'last_name' ),

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isInactive: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),
} );