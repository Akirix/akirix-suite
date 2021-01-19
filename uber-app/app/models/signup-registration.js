import Ember from 'ember';

export default Ember.Object.extend( {
    user_id: null,
    institution_id: null,
    created: null,
    modified: null,
    account_type: null,
    ip: null,

    isBusiness: function(){
        return this.get( 'account_type' ) === 'business';
    }.property( 'account_type' ),

    isPersonal: function(){
        return this.get( 'account_type' ) === 'personal';
    }.property( 'account_type' ),

    currentStep: function(){
        var nextStep = this.get( 'sortedAppSteps' ).findBy( 'status', 0 );
        if( !Ember.isEmpty( nextStep ) ){
            return nextStep.name;
        }
        else{
            return 'Complete';
        }
    }.property( 'appSteps' ),

    appSteps: [],
    appStepsSorting: [ 'order' ],
    sortedAppSteps: Ember.computed.sort( 'appSteps', 'appStepsSorting' ),

    company: {
        name: null,
        address: null,
        address_2: null,
        city: null,
        state_province: null,
        postal_code: null,
        country: null,
        trading_same: null,
        trading_address: null,
        trading_address_2: null,
        trading_city: null,
        trading_postal_code: null,
        trading_state_province: null,
        trading_country: null,
        phone_office: null,
        website: null,
        duns_number: null,
        company_number: null,
        tax_num: null,
        tax_num_type: null,
        agreement: null
    },

    user: {
        first_name: null,
        email: null,
        date_of_birth: null,
        last_name: null,
        phone_mobile: null,
        phone_office: null,
        id_type: null,
        id_country: null,
        id_num: null
    },

    str_date_of_birth: function(){
        return moment( this.get( 'user.date_of_birth' ) ).format( 'YYYY-MM-DD' );
    }.property( 'user.date_of_birth' ),

    inquiries: [],
    documents: [],
    owners: [],

    activeDocuments: function(){
        return this.get( 'sortedDocuments' ).filterBy( 'status', 1 ).sortBy( 'document_type' );
    }.property( 'documents' ),

    documentsSorting: [ 'document_type' ],
    sortedDocuments: Ember.computed.sort( 'documents', 'documentsSorting' ),

    percentComplete: function(){
        var completedSteps = this.get( 'appSteps' ).filterBy( 'status', 1 );
        return ( completedSteps.length / 5 ) * 100;
    }.property( 'appSteps' ),

    age: function(){
        var now = moment();
        var then = moment( this.get( 'created' ) );
        return now.diff( then, 'days' ) + ' Days';
    }.property( 'created' ),

    riskScore: function(){
        var score = {
            exceptions: 0,
            company_info: 0,
            user_info: 0,
            questionnaire: 0,
            documents: 0
        };
        if( this.get( 'account_type' ) === 'business' ){
            score.exceptions += 15;
        }
        else if( this.get( 'account_type' ) === 'personal' ){
            score.exceptions += 10;
        }

        if( this.get( 'company.phone_office' ) != null ){
            score.company_info += 5;
        }
        if( this.get( 'company.website' ) != null ){
            score.company_info += 3;
        }
        if( this.get( 'user.phone_office' ) != null ){
            score.company_info += 5;
        }
        for( var i = 0; i < this.get( 'inquiries' ).length; i++ ){
            if( this.get( 'inquiries' )[ i ].question == "Do you occupy, or have you occupied, any high government position?" ){
                if( this.get( 'inquiries' )[ i ].answer == "No" ){
                    score.questionnaire += 10;
                }

            }
            if( this.get( 'inquiries' )[ i ].question == "Does anyone who benefits from your company occupy, or have they occupied, any high government position?" ){
                if( this.get( 'inquiries' )[ i ].answer == "No" ){
                    score.questionnaire += 5;
                }

            }
            if( this.get( 'inquiries' )[ i ].question == "Are you or your company currently involved in any lawsuits?" ){
                if( this.get( 'inquiries' )[ i ].answer == "No" ){
                    score.questionnaire += 15;
                }

            }
            if( this.get( 'inquiries' )[ i ].question == "Will you be using your account for personal bill payment?" ){
                if( this.get( 'inquiries' )[ i ].answer == "No" ){
                    score.questionnaire += 5;
                }

            }
            if( this.get( 'inquiries' )[ i ].question == "Will you be using your account for charitable donations?" ){
                if( this.get( 'inquiries' )[ i ].answer == "No" ){
                    score.questionnaire += 10;
                }

            }
            if( this.get( 'inquiries' )[ i ].question == "How did you hear about us?" ){
                if( this.get( 'inquiries' ).answer != null ){
                    if( this.get( 'inquiries' )[ i ].answer.answer_1 == "Referred" ){
                        score.questionnaire += 2;
                    }
                }
            }
        }
        var docs = {
            company: 0,
            primary_id: 0,
            secondary_id: 0,
            proof_of_address: 0,
            financial_identity: 0,
            tax_identity: 0
        };
        for( var i = 0; i < this.get( 'documents' ).length; i++ ){
            if( this.get( 'documents' )[ i ].verified == true ){
                if( this.get( 'documents' )[ i ].document_type == "corporate_documents" ){
                    if( docs.company < 15 ){
                        docs.company += 15;
                        if( this.get( 'company.duns_number' ) ){
                            docs.company += 5;
                        }
                    }
                }
                if( this.get( 'documents' )[ i ].document_type == "primary_id" ){
                    if( docs.primary_id < 5 ){
                        docs.primary_id += 15
                    }
                }
                if( this.get( 'documents' )[ i ].document_type == "secondary_id" ){
                    if( docs.secondary_id < 10 ){
                        docs.secondary_id += 10;
                    }
                }
                if( this.get( 'documents' )[ i ].document_type == "proof_of_address" ){
                    if( docs.proof_of_address < 10 ){
                        docs.proof_of_address += 10;
                    }
                }
                if( this.get( 'documents' )[ i ].document_type == "financial_identity" ){
                    if( docs.financial_identity < 10 ){
                        docs.financial_identity += 10;
                    }
                }
                if( this.get( 'documents' )[ i ].document_type == "tax_identity" ){
                    if( docs.tax_identity < 5 ){
                        docs.tax_identity += 10;
                    }
                }
            }
        }
        for( var item in docs ){
            score.documents += docs[ item ];
        }

        var total = 0;

        for( var item in score ){
            total += score[ item ];
        }
        return total;
    }.property( 'company', 'user', 'inquiries@each.answer', 'documents@each.document_type', 'documents@each.verified' ),


    appStepWatcher: function(){
        var appSteps = this.get( 'appSteps' );
        appSteps.forEach( function( item ){
            Ember.set( item, 'complete', item.status === 1 );
            Ember.set( item, 'emberRoute', 'registrations.view.' + item.route );
        } );
    }.observes( 'appSteps' ).on( 'init' ),

    inquiriesWatcher: function(){
        var inquiries = this.get( 'inquiries' );
        inquiries.forEach( function( item, index, enumerable ){
            // text input
            if( item.type === 0 ){
                Ember.set( item, 'input', true );
            }
            // Binary yes/no
            else if( item.type === 1 ){
                Ember.set( item, 'radio', true );
            }
            // Binary yes/no
            else if( item.type === 2 ){
                Ember.set( item, 'input-single', true );
            }
        } );
    }.observes( 'inquiries' ).on( 'init' ),

    setTradingVolume: function(){
        if( !this.get( 'tradingVolume' ) ){
            this.set( 'tradingVolume', {
                vol_in_type : null,
                vol_in_amount : null,
                vol_out_amount : null,
                vol_out_type : null
            } );
        }
    }.observes( 'tradingVolume' ).on( 'init' )
} );

