
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var DocumentSchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },

    document_type: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    type: {
        type: String
    },

    last_modified: {
        type: Date
    },

    data: {
        type: String,
        required: true
    }
} );

DocumentSchema.statics.acceptedFileTypes = [ 'image/gif', 'image/jpeg', 'image/pjpeg', 'application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel' ];

mongoose.model( 'Document', DocumentSchema );