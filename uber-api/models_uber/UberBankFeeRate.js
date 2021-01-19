var Promise = require( 'promise' );
var math = require( 'mathjs' );
var Sequelize = require( 'sequelize' );
var fs = require( 'fs' );
var _ = require( 'lodash' );
var request = require( 'request' );

var db = require( '../models' );
var _this = this;

module.exports = function( sequelize, DataTypes ){
    var UberBankFeeRate = sequelize.define( 'UberBankFeeRate', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },
            data: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false
            }
        },
        {
            tableName: 'uber_bank_fee_rates',
            classMethods: {
                getWireCosts: function(){
                    // Find the current active UberBankFeeRate and convert the data to object
                    return UberBankFeeRate.find( {
                        where: { status: 1 }
                    } ).then( function( bankFeeRate ){
                        // Count all the different types of wires of the company and calculate the cost

                        var bankFeeRateObj = JSON.parse( bankFeeRate.data );

                        var ach_in_additional_cost = bankFeeRateObj.bai_transactions_reported + bankFeeRateObj.ach_perfect_receivables_item + bankFeeRateObj.ceo_event_messaging_service_email;
                        var wire_in_additional_cost = bankFeeRateObj.bai_transactions_reported + bankFeeRateObj.wire_perfect_receivables_per_item + bankFeeRateObj.ceo_event_messaging_service_email;
                        var ach_out_additional_cost = bankFeeRateObj.payment_manager_ach_confirmation + bankFeeRateObj.payment_mgr_secure_email_service + bankFeeRateObj.payment_mgr_secure_email_service;
                        var wire_out_additional_cost = bankFeeRateObj.payment_manager_wire_confirmation + bankFeeRateObj.payment_mgr_secure_email_service + bankFeeRateObj.payment_mgr_secure_email_service;

                        var costAmount = {};

                        costAmount.ach_in_usd_dom_rate = bankFeeRateObj.ach_received_item + ach_in_additional_cost;
                        costAmount.ach_out_usd_dom_rate = bankFeeRateObj.payment_manager_domestic_ach_tran + ach_out_additional_cost;
                        costAmount.ach_in_usd_intl_rate = costAmount.ach_in_usd_dom_rate;
                        costAmount.ach_out_usd_intl_rate = costAmount.ach_out_usd_dom_rate;
                        costAmount.ach_in_mca_dom_rate = costAmount.ach_in_usd_dom_rate;
                        costAmount.ach_out_mca_dom_rate = costAmount.ach_out_usd_dom_rate;
                        costAmount.ach_in_mca_intl_rate = costAmount.ach_in_usd_dom_rate;
                        costAmount.ach_out_mca_intl_rate = costAmount.ach_out_usd_dom_rate;
                        costAmount.usd_in_dom = bankFeeRateObj.wire_in_domestic + wire_in_additional_cost;
                        costAmount.usd_in_intl = bankFeeRateObj.wire_in_intl_usd_or_fx + wire_in_additional_cost;
                        costAmount.usd_out_dom = bankFeeRateObj.payment_manager_wire_out_domestic + wire_out_additional_cost;
                        costAmount.usd_out_intl = bankFeeRateObj.payment_manager_wire_out_intl_usd + wire_out_additional_cost;
                        costAmount.mca_in_dom = bankFeeRateObj.global_wire_in_international + wire_in_additional_cost;
                        costAmount.mca_in_intl = bankFeeRateObj.global_wire_in_international + wire_in_additional_cost;
                        costAmount.mca_out_dom = bankFeeRateObj.fgn_exchange_online_global_wireout + wire_out_additional_cost;
                        costAmount.mca_out_intl = bankFeeRateObj.fgn_exchange_online_global_wireout + wire_out_additional_cost;

                        return costAmount;
                    } )
                }
            }
        } );
    return UberBankFeeRate;
};
