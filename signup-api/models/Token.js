

var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var TokenSchema = new Schema( {

    data: {
        type: String,
        required: true
    },

    expires: {
        type: Date,
        required: true
    }
} );

mongoose.model( 'Token', TokenSchema );