
module.exports = function( sequelize, DataTypes ){
    var UberMonRule = sequelize.define( 'UberMonRule', {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            model: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },

            rule: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 1,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            }
        },
        {
            tableName: 'uber_mon_rules',
            classMethods: {
                validateRule: function( rule ){
                    return new Promise( function( resolve, reject ){
                        try{
                            var ruleObj = JSON.parse( rule );
                        }
                        catch( err ){
                            reject( err );
                        }
                        var errors = [];
                        var validFields = [ 'name', 'match_type', 'value' ];
                        ruleObj.forEach( function( field ){
                            validFields.forEach( function( validField ){
                                if( !field.hasOwnProperty( validField ) ){
                                    errors.push( validField + ' is a required property in rule object' )
                                }
                            } );
                        } );
                        if( errors.length > 0 ){
                            reject( errors );
                        }
                        else{
                            resolve();
                        }
                    } );
                }
            },
            instanceMethods: {
                getQuery: function(){
                    try{
                        var ruleObj = JSON.parse( this.get( 'rule' ) );
                    }
                    catch( err ){
                        throw err;
                    }
                    var query = '';
                    ruleObj.forEach( function( field, index ){
                        if( field.match_type.match( /like/ig ) ){
                            query += field.name + ' ' + field.match_type + ' "%' + field.value + '%"';
                        }
                        else if( field.match_type === 'IN' ){
                            var tmpArr = field.value.split(',');
                            query += field.name + ' ' + field.match_type + ' (';
                            tmpArr.forEach( function( item, idx ){
                                query += '"' + item.trim() + '"';
                                if( idx !== tmpArr.length - 1 ){
                                    query += ','
                                }
                            } );
                            query += ')';
                        }
                        else{
                            query += field.name + field.match_type + '"' + field.value + '"';
                        }

                        if( index !== ruleObj.length - 1 ){
                            query += ' AND '
                        }
                        else{
                            query += ')'
                        }
                    } );
                    return query;
                }
            }
        } );
    return UberMonRule;
};