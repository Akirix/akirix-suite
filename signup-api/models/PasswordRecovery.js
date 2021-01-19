
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var PasswordRecoverySchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },

    status: {
        type: Number,
        required: true,
        default: 0
    },

    token: {
        type: String,
        required: true
    }
} );

PasswordRecoverySchema.statics.expirationTime = 900000; // 15 min in milliseconds

mongoose.model( 'PasswordRecovery', PasswordRecoverySchema );