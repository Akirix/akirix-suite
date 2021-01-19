
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var InvitationSchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    uuid: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    status: {
        type: Number,
        default: 1,
        required: true
    }
} );

mongoose.model( 'Invitation', InvitationSchema );