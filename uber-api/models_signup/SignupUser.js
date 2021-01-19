
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;



var UserSchema = new Schema( {

    email: {
        type: String,
        required: true
    },

    hash: {
        type: String,
        required: true
    },

    status: {
        type: Number,
        default: 1,
        required: true
    }
} );

mongoose.model( 'User', UserSchema );