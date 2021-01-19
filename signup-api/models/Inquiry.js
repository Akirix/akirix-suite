
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var InquirySchema = new Schema( {

    created: {
        type: Date,
        default: Date.now,
        required: true
    },

    modified: {
        type: Date,
        default: Date.now
    },

    status: {
        type: Number,
        default: 1
    },

    type: {
        type: Number,
        required: true
    },
    account_types: {
        type: [],
        required: true
    },

    question: {
        type: String,
        required: true
    },

    required: {
        type: Boolean,
        required: true,
        default: true
    },

    help_text: {
        type: String
    },

    order: {
        type: Number,
        required: true
    }
} );


InquirySchema.statics.getDefaults = function(){
    var order = 0;
    return [
        {
            question: 'Do you occupy, or have you occupied, any high government position?',
            required: true,
            help_text: 'High Position political official (Czar), an individual that has in the past or currently holds an official governing or political position in any area of the world.',
            type: 1,
            account_types: [ 'personal', 'business' ],
            order: order++
        },
        {
            question: 'Does anyone who benefits from your company occupy, or have they occupied, any high government position?',
            required: true,
            help_text: 'Beneficial High Position political official, an individual, stands to gain profits that has in the past or currently holds an official governing or political position in any area of the world.',
            type: 1,
            account_types: [ 'personal', 'business' ],
            order: order++
        },
        {
            question: 'Are you or your company currently involved in any lawsuits?',
            required: true,
            help_text: 'Lawsuits, persons or business involved in, pending claims, processes, or legal litigation.',
            type: 1,
            account_types: [ 'personal', 'business' ],
            order: order++
        },
        {
            question: 'Will you be using your account for personal bill payment?',
            required: true,
            help_text: 'Private bill payments are not part of the business and relate only to you personally. Also, referred to as personal “online bill pay” service.',
            type: 1,
            account_types: [ 'business' ],
            order: order++
        },
        {
            question: 'Will you be using your account for charitable donations?',
            required: true,
            type: 1,
            account_types: [ 'personal', 'business' ],
            order: order++,
            help_text: 'Charitable Donations are a gift made by an individual or organization to a nonprofit organization, charity or private foundation. Charitable donations are commonly in the form of cash, but can also take the form of real estate, motor vehicles, appreciated securities, clothing and other assets or services.'
        },
        {
            question: 'How did you hear about us?',
            required: false,
            type: 4,
            account_types: [ 'personal', 'business' ],
            order: order++
        },
        {
            question: 'What is your primary area of business?',
            required: true,
            help_text: 'What is your area of business, what industry classification does your business fall under (Telecommunications, Construction, mining)?',
            type: 0,
            account_types: [ 'personal', 'business' ],
            order: order++
        }
    ];
};

mongoose.model( 'Inquiry', InquirySchema );