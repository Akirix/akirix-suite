

module.exports = function( sequelize, DataTypes ){
    var User = sequelize.define( 'User',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },
            first_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            last_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            hash: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            phone_mobile: {
                type: DataTypes.STRING,
                allowNull: true
            },
            access: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    notEmpty: true
                }
            },
            account_owner: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 1,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            },
            status: {
                type: DataTypes.INTEGER( 2 ),
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1 ]
                    ]
                }
            }
        },
        {
            tableName: 'users',
            associate: function( models ){
                User.belongsTo( models.Company )
            },
            classMethods: {
                getDefaultAccess: function(){
                    return JSON.stringify( {
                        "GET /status":true,
                        "GET /now":true,
                        "POST /sendInvite":true,
                        "POST /tokens":true,
                        "DELETE /tokens":true,
                        "POST /tokens/renew":true,
                        "GET /tokens/two_factor":true,
                        "GET /announcements":true,
                        "GET /currencies":true,
                        "GET /currencies/:currency_id":true,
                        "GET /accounts":true,
                        "GET /accounts/:account_id":true,
                        "GET /accounts/:account_id/download":true,
                        "GET /users/:user_id":true,
                        "PUT /users/:user_id":true,
                        "POST /users/forgot":true,
                        "POST /users/password_reset":true,
                        "GET /userSettings":true,
                        "GET /userSettings/:user_setting_id":true,
                        "PUT /userSettings/:user_setting_id":true,
                        "GET /companies":true,
                        "GET /companies/:company_id":true,
                        "PUT /companies/:company_id":true,
                        "GET /investors/:company_id":true,
                        "POST /projects":true,
                        "GET /projects":true,
                        "GET /projects/:project_id":true,
                        "POST /projects/:project_id/add_buyer":true,
                        "POST /projects/:project_id/add_supplier":true,
                        "POST /nodes":true,
                        "GET /nodes":true,
                        "GET /nodes/:node_id":true,
                        "GET /nodes/:node_id/can_invoice":true,
                        "POST /nodes/:node_id/point_funds":true,
                        "POST /nodes/:node_id/return_funds":true,
                        "PUT /nodes/:node_id":true,
                        "POST /nodes/:node_id/accept":true,
                        "POST /nodes/:node_id/decline":true,
                        "GET /nodeItems":true,
                        "POST /nodeItems":true,
                        "GET /nodeItems/:node_item_id":true,
                        "PUT /nodeItems/:node_item_id":true,
                        "POST /invoices":true,
                        "GET /invoices":true,
                        "GET /invoices/:invoice_id":true,
                        "GET /invoices/external/:invoice_id":true,
                        "GET /invoices/:invoice_id/can_create_child":true,
                        "PUT /invoices/:invoice_id":true,
                        "DELETE /invoices/:invoice_id":true,
                        "POST /invoices/:invoice_id/activate":true,
                        "POST /invoices/:invoice_id/recall":true,
                        "POST /invoices/:invoice_id/markPaid":true,
                        "POST /invoices/:invoice_id/pay":true,
                        "GET /invoices/:invoice_id/pdf":true,
                        "GET /invoiceItems":true,
                        "POST /invoiceItems":true,
                        "PUT /invoiceItems/:invoice_item_id":true,
                        "DELETE /invoiceItems/:invoice_item_id":true,
                        "GET /transactions":true,
                        "POST /wires":true,
                        "GET /wires":true,
                        "POST /wires/sendInstructions":true,
                        "GET /wires/:wire_id":true,
                        "POST /wires/:wire_id/approve":true,
                        "POST /wires/:wire_id/cancel":true,
                        "GET /wires/:wire_id/pdf":true,
                        "POST /wireTemplates":true,
                        "GET /wireTemplates":true,
                        "GET /wireTemplates/:wire_template_id":true,
                        "PUT /wireTemplates/:wire_template_id":true,
                        "DELETE /wireTemplates/:wire_template_id":true,
                        "GET /documents":true,
                        "GET /documents/:document_id":true,
                        "GET /documents/:document_id/download":true,
                        "GET /documents/:document_id/stream":true,
                        "POST /documents":true,
                        "PUT /documents/:document_id":true,
                        "DELETE /documents/:document_id":true,
                        "POST /authenticators":true,
                        "POST /authenticators/:authenticator_id/activate":true,
                        "POST /authenticators/auth":true,
                        "POST /authenticators/sms":true,
                        "GET /authenticators":true,
                        "PUT /authenticators/:authenticator_id":true,
                        "DELETE /authenticators/:authenticator_id":true,
                        "POST /funds":false,
                        "GET /funds":false,
                        "GET /funds/:fund_id":false,
                        "PUT /funds/:fund_id":false,
                        "POST /funds/:fund_id/add_project":false,
                        "POST /funds/:fund_id/remove_project":false,
                        "POST /funds/:fund_id/send":false,
                        "POST /funds/:fund_id/accept":false,
                        "POST /funds/:fund_id/decline":false,
                        "POST /funds/:fund_id/withdraw":false,
                        "POST /amendments":true,
                        "GET /amendments":true,
                        "GET /amendments/:amendment_id":true,
                        "PUT /amendments/:amendment_id":true,
                        "GET /statements":true,
                        "GET /statements/:statement_id":true,
                        "GET /statements/:statement_id/download":true,
                        "GET /stats/:type":true
                    } );
                }
            }
        } );
    return User;
};
