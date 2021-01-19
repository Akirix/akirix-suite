
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

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

mongoose.model( 'Agreement', AgreementSchema );