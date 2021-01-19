
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var DocumentTypeSchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    display_name: {
        type: String,
        required: true
    },

    icon: {
        type: String
    },

    description: {
        type: String
    },

    help_text: {
        type: String
    },

    account_type: [],

    exemptible: {
        type: Boolean,
        required: true,
        default: false
    },

    order: {
        type: Number
    }
} );

mongoose.model( 'DocumentType', DocumentTypeSchema );