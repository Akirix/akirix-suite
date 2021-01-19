
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;
var agreementContent = require( '../config/agreement.json' );

var AgreementSchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    body: {
        type: String,
        required: true
    },

    status: {
        type: Number,
        default: 1
    }
} );

AgreementSchema.statics.getDefaults = function(){
    return [ agreementContent ];
};

mongoose.model( 'Agreement', AgreementSchema );