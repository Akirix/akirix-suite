import DS from 'ember-data';

export default DS.Model.extend( {
    name: DS.attr(),
    account_number: DS.attr(),
    type: DS.attr(),
    phone: DS.attr(),
    fax: DS.attr(),
    email: DS.attr(),
    website: DS.attr(),
    address: DS.attr(),
    city: DS.attr(),
    state_province: DS.attr(),
    postal_code: DS.attr(),
    country: DS.attr(),
    notes: DS.attr(),
    created_at: DS.attr(),
    logo: DS.attr(),
    dual_custody: DS.attr(),

    isRegular: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isVendor: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    str_account_number: function(){
        return 'XYZ' + this.get( 'account_number' );
    }.property( 'account_number' ),

    str_long_name: function(){
        return 'XYZ' + this.get( 'account_number' ) + ' ' + this.get( 'name' );
    }.property( 'name', 'account_number' ),

    str_member_since: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'YYYY' );
    }.property( 'created_at' ),

    ticker: function(){
        var name = this.get( 'name' );
        if( name !== undefined ){
            name = name.replace( /\s+/g, '' );
            return name.substring( 0, 4 ).toUpperCase();
        }
        else{
            return '';
        }
    }.property( 'name' )


} );

