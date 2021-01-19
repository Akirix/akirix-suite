
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;
var uuid = require( 'node-uuid' );


var VerificationSchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },

    to: {
        type: String,
        required: true
    },

    type: {
        type: Number,
        required: true
    },

    token: {
        type: String,
        default: function(){
            return uuid.v4();
        }
    },

    status: {
        type: Number,
        default: 0
    }
} );


VerificationSchema.statics.expirationTime = 86400000; // 1 day in milliseconds

mongoose.model( 'Verification', VerificationSchema );