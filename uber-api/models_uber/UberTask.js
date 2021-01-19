module.exports = function( sequelize, DataTypes ){
    var UberTask = sequelize.define( 'UberTask', {
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
            company_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            model: {
                type: DataTypes.STRING,
                allowNull: true
            },
            model_id: {
                type: DataTypes.UUID,
                allowNull: true,
                validate: {
                    notEmpty: {
                        msg: 'Must specify model_id'
                    }
                }
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            due_date: {
                type: DataTypes.DATE,
                allowNull: true
            },
            priority: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0
            },
            sentiment: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 1
            },
            type: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                },
                comment: '0: Task, 1: Note'
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                defaultValue: 0,
                comment: '0: Not Started, 1: Pending/Active, 2: Complete'
            }
        },
        {
            tableName: 'uber_tasks'
        } );

    return UberTask;
};
