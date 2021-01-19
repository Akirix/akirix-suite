
module.exports = function( sequelize, DataTypes ){
    var UberAuthenticator = sequelize.define( 'UberAuthenticator', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify uber_user_id'
                    }
                }
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            key: {
                type: DataTypes.STRING,
                allowNull: true
            },
            reset: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2, 3, 4 ]
                    ]
                },
                comment: '0: Phone, 1: Tablet, 2: Other, 3: Yubikey, 4: Voice'
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                defaultValue: 0,
                comment: '0: New, 1: Active'
            }
        },
        {
            tableName: 'uber_authenticators',
            associate: function( models ){
                UberAuthenticator.belongsTo( models.UberUser );
            },
            classMethods: {
                validateTOTP: function( key, code ){
                    var TOTP = require( 'onceler' ).TOTP;
                    var totp = new TOTP( key, 6, 30 );
                    var verified = totp.verify( code );
                    var window = 4; // allow plus-minus four iterations

                    var counter = Math.floor( new Date().getTime() / 1000 );

                    // Check +/- 30 sec
                    if( !verified ){
                        for( var i = counter - window * 30; i <= counter + window * 30; i += 30 ){
                            verified = ( code == totp.at( i ) );
                            if( verified ) break;
                        }
                    }

                    return verified;
                }
            }
        } );

    //Authenticator.sync( {force: true} );
    return UberAuthenticator;
}
