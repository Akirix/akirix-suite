module.exports = function( sequelize, DataTypes ){
    var SecurityQuestion = sequelize.define( 'SecurityQuestion',
        {

            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            question: {
                type: DataTypes.STRING,
                allowNull: false
            },

            answer: {
                type: DataTypes.STRING,
                allowNull: false
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: true
            },

            company_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            type: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: Auto, 1: Manual'
            }

        },
        {
            tableName: 'security_questions',

            classMethods: {
                upsertQuestion: function( company_id, user_id, question, answer ){
                    return SecurityQuestion.find( {
                        where: {
                            company_id: company_id,
                            question: question
                        }
                    } ).then( function( securityQuestion ){
                        if( securityQuestion ){
                            securityQuestion.answer = answer;
                            return securityQuestion.save();
                        }
                        else{
                            return SecurityQuestion.create( {
                                company_id: company_id,
                                user_id: user_id,
                                question: question,
                                answer: answer
                            } )
                        }
                    } )
                }
            }
        }
    );
    return SecurityQuestion;
};