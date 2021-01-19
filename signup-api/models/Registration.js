
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;


var RegistrationSchema = new Schema( {

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
        default: 0,
        required: true
    },

    risk: {
        type: Number,
        default: 4,
        required: true
    },

    modified: {
        type: Date,
        default: Date.now,
        required: true
    },

    account_type: {
        type: String,
        default: null
    },

    parent_id: {
        type: String
    },

    company: {

        name: {
            type: String
        },

        address: {
            type: String
        },

        address_2: {
            type: String
        },

        city: {
            type: String
        },

        state_province: {
            type: String
        },

        postal_code: {
            type: String
        },

        country: {
            type: String
        },

        trading_same: {
            type: Boolean,
            default: true
        },

        trading_address: {
            type: String
        },

        trading_address_2: {
            type: String
        },

        trading_city: {
            type: String
        },

        trading_postal_code: {
            type: String
        },

        trading_state_province: {
            type: String
        },

        trading_country: {
            type: String
        },

        phone_office: {
            type: String
        },

        website: {
            type: String
        },

        duns_number: {
            type: String
        },

        tax_num: {
            type: String
        },

        tax_num_type: {
            type: String
        },

        company_number: {
            type: String
        },
        employee_count: {
            type: String
        },
        entity_type: {
            type: String
        }
    },
    tradingVolume: {
        vol_in_type: {
            type: String
        },
        vol_in_amount: {
            type: String
        },
        vol_out_type: {
            type: String
        },
        vol_out_amount: {
            type: String
        }
    },

    appSteps: [
        {

            name: {
                type: String
            },

            route: {
                type: String
            },

            icon: {
                type: String
            },

            status: {
                type: Number,
                default: 0
            },

            order: {
                type: Number
            }
        }
    ],
    owners: [],
    executives: [],

    user: {

        email: {
            type: String
        },

        first_name: {
            type: String
        },

        last_name: {
            type: String
        },

        phone_mobile: {
            type: String
        },

        phone_office: {
            type: String
        },

        id_type: {
            type: String
        },

        id_num: {
            type: String
        },

        id_country: {
            type: String
        },

        date_of_birth: {
            type: Date
        },
        nationality: {
            type: String
        },
        position: {
            type: String
        },
        is_owner:{
            type: Boolean
        }
    },

    userAgreement: {

        city: {
            type: String
        },

        postal_code: {
            type: String
        },

        ip: {
            type: String
        },

        agreed_on: {
            type: Date
        },

        agreement_id: {
            type: Schema.Types.ObjectId
        }
    },

    inquiries: [
        {

            question: {
                type: String
            },

            answer: {
                type: Schema.Types.Mixed,
                default: null
            },

            type: {
                type: Number,
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

            account_types: {
                type: [],
                required: true
            }
        }
    ],

    documents: [
        {

            document_id: {
                type: Schema.Types.ObjectId
            },

            document_type: {
                type: String
            },

            name: {
                type: String
            },

            type: {
                type: String
            },

            status: {
                type: Number
            },

            notes: {
                type: String,
                default: ''
            },

            verified: {
                type: Boolean,
                default: false
            },

            verified_user_id: {
                type: String,
                default: null
            },

            verified_date: {
                type: Date,
                default: null
            },

            exemption: {
                type: Boolean,
                default: false
            },

            exemption_reason: {
                type: String,
                default: null
            }
        }
    ],

    changes: [
        {
            path: {
                type: String
            },
            oldValue: {
                type: mongoose.Schema.Types.Mixed
            },
            newValue: {
                type: mongoose.Schema.Types.Mixed
            },
            time: {
                type: Date,
                default: Date.now()
            }
        }
    ],

    track_changes: {
        type: Boolean,
        default: false
    }
} );


RegistrationSchema.statics.getDefaults = function(){

    var order = 0;
    var defaults = {
        owners: [],
        executives: [],
        tradingVolume: {
            vol_in_type: null,
            vol_in_amount: null,
            vol_out_type: null,
            vol_out_amount: null
        },
        appSteps: [
            {
                name: 'Basic Info',
                route: 'info',
                icon: 'xrk-icon xrk-basic',
                status: 0,
                order: order++
            },
            {
                name: 'Ownership Info',
                route: 'owners',
                icon: 'xrk-icon xrk-owners',
                status: 0,
                order: order++
            },
            {
                name: 'Questionnaire',
                route: 'questionnaire',
                icon: 'xrk-icon xrk-questionnaire',
                status: 0,
                order: order++
            },
            {
                name: 'Documents',
                route: 'verification',
                icon: 'xrk-icon xrk-verification',
                status: 0,
                order: order++
            },
            {
                name: 'Agreement',
                route: 'agreement',
                icon: 'xrk-icon xrk-agreement',
                status: 0,
                order: order++
            }
        ]
    };

    return defaults;
};


RegistrationSchema.statics.getInviteeDefaults = function(){

    var order = 0;
    var defaults = {
        account_type: 'invitee',
        appSteps: [
            {
                name: 'User Account',
                route: 'users',
                icon: 'fa fa-user',
                status: 0,
                order: ++order
            },
            {
                name: 'Questionnaire',
                route: 'questionnaire',
                icon: 'fa fa-question-circle',
                status: 0,
                order: ++order
            },
            {
                name: 'Documents',
                route: 'documents',
                icon: 'fa fa-file-o',
                status: 0,
                order: ++order
            },
            {
                name: 'Agreement',
                route: 'agreement',
                icon: 'fa fa-pencil-square-o',
                status: 0,
                order: ++order
            },
            {
                name: 'Complete',
                route: 'complete',
                icon: 'fa fa-thumb-tack',
                status: 0,
                order: ++order
            }
        ]
    };

    return defaults;
};

mongoose.model( 'Registration', RegistrationSchema );