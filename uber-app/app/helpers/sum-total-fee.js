import Ember from "ember";
var locale = new Globalize(navigator.language);
export default Ember.Handlebars.makeBoundHelper(function(value, type) {
    var ouputString = '';
    switch (type) {
        case 'company-totalCounts':
            ouputString =
                value.invoices_count +
                value.wires_in_count +
                value.wires_out_count +
                value.internal_transfers_count +
                value.fx_count -
                value.fee_refund_count
            break;
        case 'company-totalAmounts':
            ouputString = locale.format(
                value.invoices_amount +
                value.wires_in_amount +
                value.wires_out_amount +
                value.internal_transfers_amount +
                value.fx_amount,
                "n2"
            );
            break;
        case 'company-totalFees':
            ouputString = locale.format(
                value.invoices_fee +
                value.wires_in_fee +
                value.wires_out_fee +
                value.internal_transfers_fee +
                value.fx_fee -
                value.fee_refund_amount +
                value.charge_amount,
                "n2"
            );
            break;
        case "totalAmouts":
            ouputString = locale.format(
                value.invoices_amount +
                value.wire_in_amount +
                value.wire_out_amount +
                value.internal_transfers_amount +
                value.fx_amount,
                "n2"
            );
            break;
        case "totalCosts":
            ouputString = locale.format(
                value.wire_in_cost +
                value.wire_out_cost,
                "n2"
            );
            break;
        case "totalFees":
            ouputString = locale.format(
                value.invoices_fee +
                value.wire_in_fee +
                value.wire_out_fee +
                value.internal_transfers_fee +
                value.fx_fee -
                value.fee_refund_amount +
                value.charge_amount,
                "n2"
            );
            break;
    }
    return new Ember.Handlebars.SafeString(ouputString);
});
