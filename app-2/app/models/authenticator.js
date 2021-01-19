import DS from 'ember-data';
//* - 0: Phone (TOTP)
//* - 1: Tablet (TOTP)
//* - 2: Other (TOTP)
//* - 3: [Yubikey](https://www.yubico.com) (HOTP)
export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    name: DS.attr(),
    key: DS.attr(),
    status: DS.attr(),
    type: DS.attr(),
    user_id: DS.attr(),
    reset: DS.attr(),
    code: DS.attr(),

    authIcon: function(){
        switch( this.get( 'type' ) ){
            case 0:
                return '<i class="akx-icon akx-mobile icon-medium medium-grey"></i>';
            case 1:
                return '<i class="akx-icon akx-tablet icon-medium"></i>';
            case 2:
                return '<i class="akx-icon akx-cogs icon-large"></i>';
            default:
                return '<i class="akx-icon akx-yubikey icon-large"></i>';
        }
    }.property( 'type' ),

    isActive: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    canRemove: function(){
        return this.get( 'type' ) !== 3;
    }.property( 'type' ),

    isYubikey: function(){
        return this.get( 'type' ) === 3;
    },

    getStatus: function(){
        if( this.get( 'status' ) === 0 ){
            return 'New authenticator';
        }
        return 'Active';
    }.property( 'status' )
} );
