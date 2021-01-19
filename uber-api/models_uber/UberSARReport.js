var Promise = require( 'promise' );
var config_data = require( '../config/config.json' ).sar_submission;
var padEnd = require( 'lodash.padend' );
var padStart = require( 'lodash.padstart' );
var moment = require( 'moment-timezone' );
var request = require( 'request' );
var xmlBuilder = require( 'xmlbuilder' );
var xmlParser = require( 'xml2json' );
var math = require( 'mathjs' );

var self = this;

module.exports = function( sequelize, DataTypes ){
    var UberSARReport = sequelize.define( 'UberSARReport', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            uber_user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Must specify uber_user_id'
                    }
                }
            },


            status: {
                type: DataTypes.INTEGER( 2 ).UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    isIn: [
                        [ 0, 1, 2 ]
                    ]
                },
                comment: "0: New, 1: Sent"
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            raw_data: {
                allowNull: true,
                type: DataTypes.TEXT
            }
        },
        {
            tableName: 'uber_sar_reports',
            associate: function( models ){
                UberSARReport.hasMany( models.UberSARSubmission );
                UberSARReport.hasMany( models.UberSARReportRelation );
            },
            classMethods: {

                generategoAMLReport: function( report ){
                    var data = JSON.parse( report.raw_data );

                    var submission_date = moment().format( 'YYYY-MM-DDTHH:HH:MM:SS' );

                    var reports = [];

                    _.forEach( data.activities, function( activity ){

                        var report = {
                            rentity_id: config_data.rentity_id,
                            submission_code: "E",
                            report_code: "STR",
                            submission_date: submission_date,
                            currency_code_local: "USD",
                            // reporting_person: "",
                            reason: activity.narrative,
                            activity: {
                                report_parties: {
                                    report_party: []
                                }
                            }
                            //report_indicators: []
                        };

                        _.forEach( activity.subjects, function( subject ){
                            subject = data[ subject.array ][ subject.index ];

                            var report_party = {};

                            if( subject.account_type === "personal" ){

                                if( !UberSARReport.anyMissing( [ subject.first_name, subject.last_name ] ) ){

                                    report_party.person = {
                                        first_name: subject.first_name,
                                        last_name: subject.last_name
                                    };

                                    report_party.person.birthdate = subject.date_of_birth;

                                    if( !UberSARReport.anyMissing( [ subject.id_type, subject.id_number ] ) ){
                                        switch( subject.id_type ){
                                            case 'PID':
                                                report_party.person.passport_number = subject.id_number;
                                                report_party.person.passport_country = subject.id_country;
                                                break;
                                            case 'SSN/TIN':
                                                report_party.person.SSN = subject.id_number;
                                                break;
                                            case 'EIN':
                                            case 'NID':
                                            default:
                                        }
                                    }

                                    if( !_.isEmpty( subject.phone ) ) {
                                        report_party.person.Phones = {};
                                        report_party.person.Phones.Phone = {
                                            tph_contact_type: "P",
                                            tph_communication_type: "M",
                                            tph_number: subject.phone
                                        };
                                    }

                                    if( !UberSARReport.anyMissing( [ subject.address, subject.city, subject.country ] ) ){
                                        report_party.person.Address = {
                                            Address_type: "P",
                                            Address: subject.address,
                                            City: subject.city,
                                            country_code: subject.country
                                        };

                                        if( !_.isEmpty( subject.state_province ) ){
                                            report_party.person.State = subject.state_province;
                                        }

                                        if( !_.isEmpty( subject.postal_code ) ){
                                            report_party.person.Zip = subject.postal_code;
                                        }
                                    }

                                    if( !_.isEmpty( subject.nationality ) ){
                                        report_party.person.Nationality1 = subject.nationality;
                                    }

                                    if( !_.isEmpty( subject.country ) ){
                                        report_party.person.residence = subject.country;
                                    }

                                    if( !_.isEmpty( subject.email ) ){
                                        report_party.person.Email = subject.email;
                                    }

                                    if( !_.isEmpty( subject.tin ) ){
                                        report_party.person.tax_number = subject.tin;
                                    }
                                }
                            }
                            else if( subject.account_type === "business" ){

                                if( !_.isEmpty( subject.name ) ){

                                    report_party.entity = {
                                        Name: subject.name
                                    };

                                    if( !_.isEmpty( subject.country ) ){
                                        report_party.entity.incorporation_country = subject.country;
                                    }

                                    if( !_.isEmpty( subject.phone ) ) {
                                        report_party.entity.Phones = {};
                                        report_party.entity.Phones.Phone = {
                                            tph_contact_type: "P",
                                            tph_communication_type: "M",
                                            tph_number: subject.phone
                                        };
                                    }

                                    if( !UberSARReport.anyMissing( [ subject.address, subject.city, subject.country ] ) ){
                                        report_party.entity.Address = {
                                            Address_type: "P",
                                            Address: subject.address,
                                            City: subject.city,
                                            country_code: subject.country
                                        };

                                        if( !_.isEmpty( subject.state_province ) ){
                                            report_party.entity.State = subject.state_province;
                                        }

                                        if( !_.isEmpty( subject.postal_code ) ){
                                            report_party.entity.Zip = subject.postal_code;
                                        }
                                    }

                                    if( !_.isEmpty( subject.email ) ){
                                        report_party.entity.Email = subject.email;
                                    }

                                    if( !_.isEmpty( subject.state_province ) ){
                                        report_party.entity.tincorporation_state = subject.state_province;
                                    }

                                    if( !_.isEmpty( subject.country ) ){
                                        report_party.entity.incorporation_country = subject.country;
                                    }

                                    if( !_.isEmpty( subject.tin ) ){
                                        report_party.entity.tax_number = subject.tin;
                                    }
                                }

                            }

                            if( !_.isEmpty( report_party ) ){
                            	report.activity.report_parties.report_party.push( report_party );
                            }
                        } );

                        reports.push( xmlBuilder.create( { report: report } ).end( { pretty: true } ) );
                    } );

                    return reports;
                },

                generateSARReport: function( report, fileType ){

                    return this.getECBRates( "USD" ).then( function( rates ){

                        switch( fileType ){
                            case 'ascii':
                                return UberSARReport.asciiSAR( report, rates );
                            case 'xml':
                                return UberSARReport.xmlSAR( report, rates );
                            default:
                                return new Error( fileType + ' is not a known file type.' );
                        }
                    } );
                },
                
                xmlSAR: function( report, rates ){
                	
                    //Extract the data from the report
                    var data = JSON.parse( report.raw_data );

                    //Sequence numbers will start at 2 because we use 1 at the bottom for the root element
                    //Note that they will increment every time they are used (seqNum++)
                    var seqNum = 2;

                    //Start off the xml document with a EFilingBatchXML element as the root element
                    var xml = xmlBuilder.create( 'fc2:EFilingBatchXML', { 'version': '1.0', 'encoding': 'UTF-8' } )

                    //Put FormTypeCode element into EFilingBathXML element
                    xml.ele( 'fc2:FormTypeCode' ).text( 'FinCEN SARX' );

                    //Find the amount of all transactions
                    var amount;
                    var amountUnknown = false;
                    var totalAmount = 0;
                    if( data.transactions.length > 0 ){
                        amount = 0;
                        _.forEach( data.transactions, function( transaction ){
                            var baseRate = 1;
                            if( transaction.type === "Wire" ){
                                if( transaction.currency_id !== "USD" ){
                                    baseRate = baseRate / rates[ transaction.currency_id ];
                                    amount += ( transaction.amount * ( baseRate / rates[ transaction.currency_id ] ) );
                                }
                                else{
                                    amount += transaction.amount;
                                }
                            }
                            else if( transaction.type === "FXRequest" ){
                                if( transaction.counter_currency_id !== "USD" ){
                                    baseRate = baseRate / rates[ transaction.counter_currency_id ];
                                    amount += ( transaction.counter_amount * ( baseRate / rates[ transaction.counter_currency_id ] ) );
                                }
                                else{
                                    amount += transaction.counter_amount;

                                }
                            }
                        } );
                        amount = math.round( Number( amount ) );
                    }
                    else amountUnknown = true;

                    //Build activity elements into EFilingBathXML element
                    var activityElementsCount = 0;
                    var subjectPartyElementsCount = 0;
                    _.forEach( data.activities, function( activity ){

                        //Put Activity element into EFilingBathXML element
                        var activityElement = xml.ele( 'fc2:Activity', { seqNum: seqNum++ } );

                        //Put the FilingDateText element into the Activity element
                        //Pacific/Midway is the furthest possible time from UTC in the negative direction
                        //This ensures that the date recorded will NEVER be later than now anywhere in the world (as this would make FinCEN not accept the submission)
                        //Format MUST be YYYYMMDD for FinCEN to accept the submission
                        activityElement.ele( 'fc2:FilingDateText' ).text( moment().format( 'YYYYMMDD' ) );

                        //Put the ActivityAssociation element into the Activity element
                        var activityAssociation = activityElement.ele( 'fc2:ActivityAssociation', { seqNum: seqNum++ } );

                        //If is an initial report
                        //TODO: make this actually work!!
                        if( true ){

                            //Put InitialReportIndicator element into ActivityAssociation element
                            activityAssociation.ele( 'fc2:InitialReportIndicator' ).text( 'Y' );
                        }

                        //Otherwise, continuing a report
                        else{

                            //Put ContinuingActivityReportIndicator element into ActivityAssociation element
                            activityAssociation.ele( 'fc2:ContinuingActivityReportIndicator' ).text( 'Y' );

                            //If correcting or amending a previously filed report (vs just adding to report like is case with adding above element by itself.  NOTE: above element IS STILL needed!)
                            //TODO: make this actually work!!
                            if( false ){

                                //Put CorrectsAmendsPriorReportIndicator element into ActivityAssociation element
                                activityAssociation.ele( 'fc2:CorrectsAmendsPriorReportIndicator' ).text( 'Y' );
                            }
                        }

                        //Put the Party (transmitter) element into Activity element
                        var transmitterParty = activityElement.ele( 'fc2:Party', { seqNum: seqNum++ } );

                        //Put the ActivityPartyTypeCode onto Party (transmitter) element
                        //Code '35' represents "Transmitter" type
                        transmitterParty.ele( 'fc2:ActivityPartyTypeCode' ).text( '35' );

                        //Put the PartyName element into Party (transmitter) element
                        var transmitterPartyName = transmitterParty.ele( 'fc2:PartyName', { seqNum: seqNum++ } );

                        //Put the PartyNameTypeCode element into PartyName element
                        //Code 'L' represents "Legal Name" (vs "'DBA' for doing business as" or "'AKA' for also known as")
                        //Code 'L' is required for 'transmitter' party type
                        transmitterPartyName.ele( 'fc2:PartyNameTypeCode' ).text( 'L' );

                        //Put the RawPartyFullName element into PartyName element
                        transmitterPartyName.ele( 'fc2:RawPartyFullName' ).text( config_data.name );

                        //Put the Address element into Party (transmitter) element
                        var transmitterAddress = transmitterParty.ele( 'fc2:Address', { seqNum: seqNum++ } );

                        //Put RawCountryCodeText element into Address element
                        transmitterAddress.ele( 'fc2:RawCountryCodeText' ).text( config_data.country_code );

                        //Put RawZIPCode element into Address element
                        transmitterAddress.ele( 'fc2:RawZIPCode' ).text( config_data.postal_code );

                        //Put RawStateCodeText element into Address element
                        transmitterAddress.ele( 'fc2:RawStateCodeText' ).text( config_data.state_province );

                        //Put RawCityText element into Address element
                        transmitterAddress.ele( 'fc2:RawCityText' ).text( config_data.city );

                        //Put RawStreetAddress1Text element into Address element
                        transmitterAddress.ele( 'fc2:RawStreetAddress1Text' ).text( config_data.address );

                        //Put the PhoneNumber element into Party (transmitter) element
                        var transmitterPhoneNumber = transmitterParty.ele( 'fc2:PhoneNumber', { seqNum: seqNum++ } );

                        //Put PhoneNumberText element into PhoneNumber element
                        transmitterPhoneNumber.ele( 'fc2:PhoneNumberText' ).text( config_data.phone );

                        //Put BOTH (requires TCC and TIN for transmitter) of the PartyIdentification elements into Party (transmitter) element
                        var transmitterPartyIdentification1 = transmitterParty.ele( 'fc2:PartyIdentification', { seqNum: seqNum++ } );
                        var transmitterPartyIdentification2 = transmitterParty.ele( 'fc2:PartyIdentification', { seqNum: seqNum++ } );

                        //Put PartyIdentificationTypeCode element into first PartyIdentification element
                        transmitterPartyIdentification1.ele( 'fc2:PartyIdentificationTypeCode' ).text( '28' );

                        //Put PartyIdentificationNumberText element into first PartyIdentification element
                        transmitterPartyIdentification1.ele( 'fc2:PartyIdentificationNumberText' ).text( config_data.TCC );

                        //Put PartyIdentificationTypeCode element into second PartyIdentification element
                        transmitterPartyIdentification2.ele( 'fc2:PartyIdentificationTypeCode' ).text( '4' );

                        //Put PartyIdentificationNumberText element into second PartyIdentification element
                        transmitterPartyIdentification2.ele( 'fc2:PartyIdentificationNumberText' ).text( config_data.TIN );



                        //Put the Party (transmitter contact) element into Activity element
                        var transmitterContactParty = activityElement.ele( 'fc2:Party', { seqNum: seqNum++ } );

                        //Put the ActivityPartyTypeCode onto Party (transmitter contact) element
                        //Code '37' represents "Transmitter Contact" type
                        transmitterContactParty.ele( 'fc2:ActivityPartyTypeCode' ).text( '37' );

                        //Put the PartyName element into Party (transmitter contact) element
                        var transmitterContactPartyName = transmitterContactParty.ele( 'fc2:PartyName', { seqNum: seqNum++ } );

                        //Put the PartyNameTypeCode element into PartyName element
                        //Code 'L' represents "Legal Name" (vs "'DBA' for doing business as" or "'AKA' for also known as")
                        //Code 'L' is required for 'transmitter contact' party type
                        transmitterContactPartyName.ele( 'fc2:PartyNameTypeCode' ).text( 'L' );

                        //Put the RawPartyFullName element into PartyName element
                        transmitterContactPartyName.ele( 'fc2:RawPartyFullName' ).text( config_data.official_contact );



                        //Put the Party (filing institution) element into Activity element
                        var filingInstitutionParty = activityElement.ele( 'fc2:Party', { seqNum: seqNum++ } );

                        //Put the ActivityPartyTypeCode onto Party (filing institution) element
                        //Code '30' represents "Filing Institution" type
                        filingInstitutionParty.ele( 'fc2:ActivityPartyTypeCode' ).text( '30' );

                        //Put PrimaryRegulatorTypeCode element into Party (filing institution) element
                        filingInstitutionParty.ele( 'fc2:PrimaryRegulatorTypeCode' ).text( config_data.regulator_type );

                        //Put the PartyName element into Party (filing institution) element
                        var filingInstitutionPartyName = filingInstitutionParty.ele( 'fc2:PartyName', { seqNum: seqNum++ } );

                        //Put the PartyNameTypeCode element into PartyName element
                        //Code 'L' represents "Legal Name" (vs "'DBA' for doing business as" or "'AKA' for also known as")
                        //Code 'L' is required for 'filing institution' party type
                        filingInstitutionPartyName.ele( 'fc2:PartyNameTypeCode' ).text( 'L' );

                        //Put the RawPartyFullName element into PartyName element
                        filingInstitutionPartyName.ele( 'fc2:RawPartyFullName' ).text( config_data.name );

                        //Put the Address element into Party (filing institution) element
                        var filingInstitutionAddress = filingInstitutionParty.ele( 'fc2:Address', { seqNum: seqNum++ } );

                        //Put RawCountryCodeText element into Address element
                        filingInstitutionAddress.ele( 'fc2:RawCountryCodeText' ).text( config_data.country_code );

                        //Put RawZIPCode element into Address element
                        filingInstitutionAddress.ele( 'fc2:RawZIPCode' ).text( config_data.postal_code );

                        //Put RawStateCodeText element into Address element
                        filingInstitutionAddress.ele( 'fc2:RawStateCodeText' ).text( config_data.state_province );

                        //Put RawCityText element into Address element
                        filingInstitutionAddress.ele( 'fc2:RawCityText' ).text( config_data.city );

                        //Put RawStreetAddress1Text element into Address element
                        filingInstitutionAddress.ele( 'fc2:RawStreetAddress1Text' ).text( config_data.address );

                        //Put PartyIdentification element into Party (filing institution) element
                        var filingInstitutionPartyIdentification = filingInstitutionParty.ele( 'fc2:PartyIdentification', { seqNum: seqNum++ } );

                        //Put PartyIdentificationTypeCode element into PartyIdentification element
                        filingInstitutionPartyIdentification.ele( 'fc2:PartyIdentificationTypeCode' ).text( '2' );

                        //Put PartyIdentificationNumberText element into PartyIdentification element
                        filingInstitutionPartyIdentification.ele( 'fc2:PartyIdentificationNumberText' ).text( config_data.EIN );

                        //Put OrganizationClassificationTypeSubtype element into Party (filing institution) element
                        var filingInstitutionOrganizationClassificationTypeSubtype = filingInstitutionParty.ele( 'fc2:OrganizationClassificationTypeSubtype', { seqNum: seqNum++ } );

                        //Put OrganizationTypeID element into OrganizationClassificationTypeSubtype element
                        filingInstitutionOrganizationClassificationTypeSubtype.ele( 'fc2:OrganizationTypeID' ).text( config_data.organization_type );

                        //Only add organization other type code text if it is needed and is available
                        if( parseInt( config_data.organization_type ) == 999 && !UberSARReport.isMissing( config_data.organization_other_type_text ) ){

                            //Put OtherOrganizationTypeText element into OrganizationClassificationTypeSubtype element
                            filingInstitutionOrganizationClassificationTypeSubtype.ele( 'fc2:OtherOrganizationTypeText' ).text( config_data.organization_other_type_text );
                        }

                        //Only add organization other sub type code if it is available
                        if( !UberSARReport.isMissing( config_data.organization_sub_type ) ){

                            //Put OrganizationSubtypeID element into OrganizationClassificationTypeSubtype element
                            filingInstitutionOrganizationClassificationTypeSubtype.ele( 'fc2:OrganizationSubtypeID' ).text( config_data.organization_sub_type );

                            //Only add organization other sub type code text if it is needed and is available
                            if( parseInt( config_data.organization_sub_type ) == 5999 && !UberSARReport.isMissing( config_data.organization_other_sub_type_text ) ){

                                //Put OtherOrganizationSubTypeText element into OrganizationClassificationTypeSubtype element
                                filingInstitutionOrganizationClassificationTypeSubtype.ele( 'fc2:OtherOrganizationSubTypeText' ).text( config_data.organization_other_sub_type_text );
                            }
                        }

                        //Put the Party (contact office) element into Activity element
                        var contactOfficeParty = activityElement.ele( 'fc2:Party', { seqNum: seqNum++ } );

                        //Put the ActivityPartyTypeCode onto Party (contact office) element
                        //Code '8' represents "Contact Office" type
                        contactOfficeParty.ele( 'fc2:ActivityPartyTypeCode' ).text( '8' );

                        //Put the PartyName element into Party (contact office) element
                        var contactOfficePartyName = contactOfficeParty.ele( 'fc2:PartyName', { seqNum: seqNum++ } );

                        //Put the PartyNameTypeCode element into PartyName element
                        //Code 'L' represents "Legal Name" (vs "'DBA' for doing business as" or "'AKA' for also known as")
                        //Code 'L' is required for 'contact office' party type
                        contactOfficePartyName.ele( 'fc2:PartyNameTypeCode' ).text( 'L' );

                        //Put the RawPartyFullName element into PartyName element
                        contactOfficePartyName.ele( 'fc2:RawPartyFullName' ).text( config_data.name );

                        //Put the PhoneNumber element into Party (contact office) element
                        var contactOfficePhoneNumber = contactOfficeParty.ele( 'fc2:PhoneNumber', { seqNum: seqNum++ } );

                        //Put PhoneNumberText element into PhoneNumber element
                        contactOfficePhoneNumber.ele( 'fc2:PhoneNumberText' ).text( config_data.phone );



                        //Put the Party (financial institution where activity occurred) element into Activity element
                        var financialInstitutionWhereActivityOccurredParty = activityElement.ele( 'fc2:Party', { seqNum: seqNum++ } );

                        //Put the ActivityPartyTypeCode onto Party (financial institution where activity occurred) element
                        //Code '34' represents "Financial Institution Where Activity Occurred" type
                        financialInstitutionWhereActivityOccurredParty.ele( 'fc2:ActivityPartyTypeCode' ).text( '34' );

                        financialInstitutionWhereActivityOccurredParty.ele( 'fc2:NoBranchActivityInvolvedIndicator' ).text( 'Y' );

                        //Put PrimaryRegulatorTypeCode element into Party (financial institution where activity occurred) element
                        financialInstitutionWhereActivityOccurredParty.ele( 'fc2:PrimaryRegulatorTypeCode' ).text( config_data.regulator_type );

                        //Put the PartyName element into Party (financial institution where activity occurred) element
                        var financialInstitutionWhereActivityOccurredPartyName = financialInstitutionWhereActivityOccurredParty.ele( 'fc2:PartyName', { seqNum: seqNum++ } );

                        //Put the PartyNameTypeCode element into PartyName element
                        //Code 'L' represents "Legal Name" (vs "'DBA' for doing business as" or "'AKA' for also known as")
                        //Code 'L' is required for 'financial institution where activity occurred' party type
                        financialInstitutionWhereActivityOccurredPartyName.ele( 'fc2:PartyNameTypeCode' ).text( 'L' );

                        //Put the RawPartyFullName element into PartyName element
                        financialInstitutionWhereActivityOccurredPartyName.ele( 'fc2:RawPartyFullName' ).text( config_data.name );

                        //Put the Address element into Party (financial institution where activity occurred) element
                        var financialInstitutionWhereActivityOccurredAddress = financialInstitutionWhereActivityOccurredParty.ele( 'fc2:Address', { seqNum: seqNum++ } );

                        //Put RawCountryCodeText element into Address element
                        financialInstitutionWhereActivityOccurredAddress.ele( 'fc2:RawCountryCodeText' ).text( config_data.country_code );

                        //Put RawZIPCode element into Address element
                        financialInstitutionWhereActivityOccurredAddress.ele( 'fc2:RawZIPCode' ).text( config_data.postal_code );

                        //Put RawStateCodeText element into Address element
                        financialInstitutionWhereActivityOccurredAddress.ele( 'fc2:RawStateCodeText' ).text( config_data.state_province );

                        //Put RawCityText element into Address element
                        financialInstitutionWhereActivityOccurredAddress.ele( 'fc2:RawCityText' ).text( config_data.city );

                        //Put RawStreetAddress1Text element into Address element
                        financialInstitutionWhereActivityOccurredAddress.ele( 'fc2:RawStreetAddress1Text' ).text( config_data.address );

                        //Put PartyIdentification element into Party (financial institution where activity occurred) element
                        var financialInstitutionWhereActivityOccurredPartyIdentification = financialInstitutionWhereActivityOccurredParty.ele( 'fc2:PartyIdentification', { seqNum: seqNum++ } );

                        //Put PartyIdentificationTypeCode element into PartyIdentification element
                        financialInstitutionWhereActivityOccurredPartyIdentification.ele( 'fc2:PartyIdentificationTypeCode' ).text( '2' );

                        //Put PartyIdentificationNumberText element into first PartyIdentification element
                        financialInstitutionWhereActivityOccurredPartyIdentification.ele( 'fc2:PartyIdentificationNumberText' ).text( config_data.EIN );

                        //Put OrganizationClassificationTypeSubtype element into Party (filing institution) element
                        var financialInstitutionWhereActivityOccurredClassificationTypeSubtype = financialInstitutionWhereActivityOccurredParty.ele( 'fc2:OrganizationClassificationTypeSubtype', { seqNum: seqNum++ } );

                        //Put OrganizationTypeID element into OrganizationClassificationTypeSubtype element
                        financialInstitutionWhereActivityOccurredClassificationTypeSubtype.ele( 'fc2:OrganizationTypeID' ).text( config_data.organization_type );

                        //Only add organization other type code text if it is needed and is available
                        if( parseInt( config_data.organization_type ) == 999 && !UberSARReport.isMissing( config_data.organization_other_type_text ) ){

                            //Put OtherOrganizationTypeText element into OrganizationClassificationTypeSubtype element
                            financialInstitutionWhereActivityOccurredClassificationTypeSubtype.ele( 'fc2:OtherOrganizationTypeText' ).text( config_data.organization_other_type_text );
                        }

                        //Only add organization other sub type code if it is available
                        if( !UberSARReport.isMissing( config_data.organization_sub_type ) ){

                            //Put OrganizationSubtypeID element into OrganizationClassificationTypeSubtype element
                            financialInstitutionWhereActivityOccurredClassificationTypeSubtype.ele( 'fc2:OrganizationSubtypeID' ).text( config_data.organization_sub_type );

                            //Only add organization other sub type code text if it is needed and is available
                            if( parseInt( config_data.organization_sub_type ) == 5999 && !UberSARReport.isMissing( config_data.organization_other_sub_type_text ) ){

                                //Put OtherOrganizationSubTypeText element into OrganizationClassificationTypeSubtype element
                                financialInstitutionWhereActivityOccurredClassificationTypeSubtype.ele( 'fc2:OtherOrganizationSubTypeText' ).text( config_data.organization_other_sub_type_text );
                            }
                        }



                        //Build "subject" Party (subject) elements into Activity element
                        _.forEach( activity.subjects, function( subject ){

                            //Get the full subject object that we are referring to
                            subject = data[ subject.array ][ subject.index ];

                            //Put the Party (subject) element into Activity element
                            var subjectParty = activityElement.ele( 'fc2:Party', { seqNum: seqNum++ } );

                            //Put the ActivityPartyTypeCode onto Party (subject) element
                            //Code '33' represents "Subject" type
                            subjectParty.ele( 'fc2:ActivityPartyTypeCode' ).text( '33' );

                            if( !UberSARReport.isMissing( subject.date_of_birth ) ){
                                subjectParty.ele( 'fc2:IndividualBirthDateText' ).text( moment( subject.date_of_birth ).format( 'YYYYMMDD' ) );
                            }
                            else{
                                subjectParty.ele( 'fc2:BirthDateUnknownIndicator' ).text( 'Y' );
                            }

                            subjectParty.ele( 'fc2:NoKnownAccountInvolvedIndicator' ).text( 'Y' );

                            subjectParty.ele( 'fc2:UnknownGenderIndicator' ).text( 'Y' );

                            //Put the PartyName element into Party (subject) element
                            var subjectPartyName = subjectParty.ele( 'fc2:PartyName', { seqNum: seqNum++ } );

                            //Put the PartyNameTypeCode element into PartyName element
                            //Code 'L' represents "Legal Name" (vs "'DBA' for doing business as" or "'AKA' for also known as")
                            subjectPartyName.ele( 'fc2:PartyNameTypeCode' ).text( 'L' );

                            //Build "business" or "personal" style PartyName elements into PartyName element
                            switch( subject.account_type ){
                                case "business":

                                    //Put the RawPartyFullName element into PartyName element
                                    subjectPartyName.ele( 'fc2:RawPartyFullName' ).text( subject.name );

                                    subjectPartyName.ele( 'fc2:EntityLastNameUnknownIndicator' ).text( 'Y' );
                                    subjectPartyName.ele( 'fc2:FirstNameUnknownIndicator' ).text( 'Y' );
                                    break;
                                case "personal":

                                    //Put RawEntityIndividualLastName element into PartyName element
                                    //If there is no last name then put EntityLastNameUnknownIndicator into PartyName element instead ('Y' is always the value)
                                    if( !UberSARReport.isMissing( subject.last_name ) ) {
                                        subjectPartyName.ele( 'fc2:RawEntityIndividualLastName' ).text( subject.last_name );
                                    }
                                    else {
                                        subjectPartyName.ele( 'fc2:EntityLastNameUnknownIndicator' ).text( 'Y' );
                                    }

                                    //Put RawIndividualFirstName element into PartyName element
                                    //If there is no last name then put FirstNameUnknownIndicator into PartyName element instead ('Y' is always the value)
                                    if( !UberSARReport.isMissing( subject.first_name ) ){
                                        subjectPartyName.ele( 'fc2:RawIndividualFirstName' ).text( subject.first_name );
                                    }
                                    else {
                                        subjectPartyName.ele( 'fc2:FirstNameUnknownIndicator' ).text( 'Y' );
                                    }

                                    //Put RawIndividualMiddleName element into PartyName element
                                    //If there is no last name then don't put RawIndividualMiddleName into PartyName element
                                    if( !UberSARReport.isMissing( subject.middle_name ) ) {
                                        subjectPartyName.ele( 'fc2:RawIndividualMiddleName' ).text( subject.middle_name );
                                    }
                                    break;
                                default:
                                    //TODO: name needs to be added!
                                    //Don't do anything when there isn't at least "personal" or "business"...
                            }

                            //Put the Address element into Party (subject) element
                            var subjectAddress = subjectParty.ele( 'fc2:Address', { seqNum: seqNum++ } );

                            //Put RawCountryCodeText element into Address element
                            //If there is no country then put CountryCodeUnknownIndicator into Address element instead ('Y' is always the value)
                            if ( !UberSARReport.isMissing( subject.country)) {
                                subjectAddress.ele( 'fc2:RawCountryCodeText' ).text( subject.country );
                            }
                            else {
                                subjectAddress.ele( 'fc2:CountryCodeUnknownIndicator' ).text( 'Y' );
                            }

                            //Put RawZIPCode element into Address element
                            //If there is no postal code then put ZIPCodeUnknownIndicator into Address element instead ('Y' is always the value)
                            if ( !UberSARReport.isMissing( subject.postal_code ) ) {
                                subjectAddress.ele( 'fc2:RawZIPCode' ).text( subject.postal_code );
                            }
                            else {
                                subjectAddress.ele( 'fc2:ZIPCodeUnknownIndicator' ).text( 'Y' );
                            }

                            //Put RawStateCodeText element into Address element
                            //If there is no state/province then put StateCodeUnknownIndicator into Address element instead ('Y' is always the value)
                            if ( !UberSARReport.isMissing( subject.state_province ) ) {
                                subjectAddress.ele( 'fc2:RawStateCodeText' ).text( subject.state_province );
                            }
                            else {
                                subjectAddress.ele( 'fc2:StateCodeUnknownIndicator' ).text( 'Y' );
                            }

                            //Put RawCityText element into Address element
                            //If there is no ity then put CityUnknownIndicator into Address element instead ('Y' is always the value)
                            if ( !UberSARReport.isMissing( subject.city ) ) {
                                subjectAddress.ele( 'fc2:RawCityText' ).text( subject.city );
                            }
                            else {
                                subjectAddress.ele( 'fc2:CityUnknownIndicator' ).text( 'Y' );
                            }

                            //Put RawStreetAddress1Text element into Address element
                            //If there is no street address then put StreetAddressUnknownIndicator into Address element instead ('Y' is always the value)
                            if ( !UberSARReport.isMissing( subject.address ) ) {
                                subjectAddress.ele( 'fc2:RawStreetAddress1Text' ).text( subject.address );
                            }
                            else {
                                subjectAddress.ele( 'fc2:StreetAddressUnknownIndicator' ).text( 'Y' );
                            }

                            //The phone should only be added if we aren't missing any of the required phone details
                            if( !UberSARReport.isMissing( subject.phone ) ) {

                                //Put the PhoneNumber element into Party (subject) element
                                var subjectPhoneNumber = subjectParty.ele( 'fc2:PhoneNumber', { seqNum: seqNum++ } );

                                //Put PhoneNumberText element into PhoneNumber element
                                //Code 'M' represents "Mobile" (vs "'R' for Residence", "'W' for Work" or "'F' for Fax")
                                subjectPhoneNumber.ele( 'fc2:PhoneNumberTypeCode' ).text( 'M' );

                                //Put PhoneNumberText element into PhoneNumber element
                                subjectPhoneNumber.ele( 'fc2:PhoneNumberText' ).text( subject.phone );

                                //Put PhoneNumberExtensionText element into PhoneNumber element
                                //If there is no phone extension then don't put PhoneNumberExtensionText element into PhoneNumber element
                                if ( !UberSARReport.isMissing( subject.phone_ext ) ) {
                                    subjectPhoneNumber.ele( 'fc2:PhoneNumberExtensionText' ).text( subject.phone_ext );
                                }
                            }

                            //Put BOTH (requires 2 of them per subject subjectParty) of the PartyIdentification elements into Party (subject) element
                            var subjectPartyIdentification1 = subjectParty.ele( 'fc2:PartyIdentification', { seqNum: seqNum++ } );
                            var subjectPartyIdentification2 = subjectParty.ele( 'fc2:PartyIdentification', { seqNum: seqNum++ } );

                            //The PartyIdentificationTypeCode element and PartyIdentificationNumberText should only be added if identity type and number submitted
                            //If there is no identity type and/or number submitted then put appropriate unknown indicator into PartyIdentification element instead (see below else clause)
                            var idTypeCode;
                            if( !UberSARReport.anyMissing( [ subject.id_type, subject.id_number ] ) ){

                                //Put PartyIdentificationNumberText element into the first PartyIdentification element
                                subjectPartyIdentification1.ele( 'fc2:PartyIdentificationNumberText' ).text( subject.id_number );

                                //Find the ID type code
                                switch ( subject.id_type.toLowerCase() ) {
                                    case 'pid': //Passports are always code '6'
                                        idTypeCode = '6';
                                        break;
                                    case 'ssn/tin': //SSNs and ITINs are always code '1'
                                        idTypeCode = '1';
                                        break;
                                    case 'ein': //EIN is always code '2'
                                        idTypeCode = '2';
                                        break;
                                    case 'nid': //NID can be code '999' for 'other' (Other type must be specified!
                                        idTypeCode = '999';
                                        var otherType = 'National ID Number';
                                    default:
                                        //TODO: THIS IS AN UNRESOLVED ERROR!!
                                }

                                //Put PartyIdentificationTypeCode element into the first PartyIdentification element
                                //Use the code found above
                                subjectPartyIdentification1.ele( 'fc2:PartyIdentificationTypeCode' ).text( idTypeCode );

                                //Put the country and state of identification
                                if( !UberSARReport.isMissing( subject.id_country ) ) {
                                    subjectPartyIdentification1.ele( 'fc2:OtherIssuerCountryText' ).text( subject.id_country );
                                }
                                if( !UberSARReport.isMissing( subject.id_state ) ) {
                                    subjectPartyIdentification1.ele( 'fc2:OtherIssuerStateText' ).text( subject.id_state );
                                }

                                //If the above identification type was '999' for 'other', we must state the other id type in text
                                if( idTypeCode == '999' ){

                                    //Put OtherPartyIdentificationTypeText element into PartyIdentification element
                                    subjectPartyIdentification1.ele( 'fc2:OtherPartyIdentificationTypeText' ).text( otherType );
                                }

                                //FinCEN requires two forms of ID, put the correct unknown indicator element on the second subjectParty identification element
                                if( idTypeCode == '1' ){
                                    subjectPartyIdentification2.ele( 'fc2:IdentificationPresentUnknownIndicator' ).text( 'Y' );
                                }
                                else {
                                    if( !UberSARReport.anyMissing( [ subject.tin_type, subject.tin ] ) ){

                                        //Find the ID type code
                                        switch( subject.tin_type.toLowerCase() ){
                                            case 'ein':
                                                idTypeCode = '2';
                                                break;
                                            case 'itin':
                                            case 'tin':
                                            case 'ssn':
                                            case 'tin/ssn':
                                            case 'ssn/tin':
                                                idTypeCode = '1';
                                                break;
                                            default:
                                                idTypeCode = 'none';
                                        }

                                        //If it wasn't a valid possible ID type
                                        if( idTypeCode === 'none' ){

                                            //Just put TINUnknownIndicator element into the second PartyIdentification element
                                            subjectPartyIdentification2.ele( 'fc2:TINUnknownIndicator' ).text( 'Y' );
                                        }
                                        else{

                                            //Put PartyIdentificationTypeCode element into the second PartyIdentification element
                                            subjectPartyIdentification2.ele( 'fc2:PartyIdentificationTypeCode' ).text( idTypeCode );

                                            //Put PartyIdentificationNumberText element into the second PartyIdentification element
                                            subjectPartyIdentification2.ele( 'fc2:PartyIdentificationNumberText' ).text( subject.tin );
                                        }
                                    }

                                    //If there was no tin_type and tin then just put TINUnknownIndicator element into the second PartyIdentification element
                                    else{
                                        subjectPartyIdentification2.ele( 'fc2:TINUnknownIndicator' ).text( 'Y' );
                                    }
                                }
                            }

                            //We have no ID type and/or number so we don't have either of the two forms of Identification
                            //Add both types of unknown indicator elements to both subjectParty identification elements
                            else {
                                subjectPartyIdentification1.ele( 'fc2:IdentificationPresentUnknownIndicator' ).text( 'Y' );

                                if( !UberSARReport.anyMissing( [ subject.tin_type, subject.tin ] ) ){

                                    //Find the ID type code
                                    switch( subject.tin_type.toLowerCase() ){
                                        case 'ein':
                                            idTypeCode = '2';
                                            break;
                                        case 'itin':
                                        case 'tin':
                                        case 'ssn':
                                        case 'tin/ssn':
                                        case 'ssn/tin':
                                            idTypeCode = '1';
                                            break;
                                        default:
                                            idTypeCode = 'none';
                                    }

                                    //If it wasn't a valid possible ID type
                                    if( idTypeCode === 'none' ){

                                        //Just put TINUnknownIndicator element into the second PartyIdentification element
                                        subjectPartyIdentification2.ele( 'fc2:TINUnknownIndicator' ).text( 'Y' );
                                    }
                                    else{

                                        //Put PartyIdentificationTypeCode element into the second PartyIdentification element
                                        subjectPartyIdentification2.ele( 'fc2:PartyIdentificationTypeCode' ).text( idTypeCode );

                                        //Put PartyIdentificationNumberText element into the second PartyIdentification element
                                        subjectPartyIdentification2.ele( 'fc2:PartyIdentificationNumberText' ).text( subject.tin );
                                    }
                                }

                                //If there was no tin_type and tin then just put TINUnknownIndicator element into the second PartyIdentification element
                                else{
                                    subjectPartyIdentification2.ele( 'fc2:TINUnknownIndicator' ).text( 'Y' );
                                }
                            }

                            //The ElectronicAddress element should only be added if we have an email for the subject
                            if( !UberSARReport.isMissing( subject.email ) ){

                                //Put ElectronicAddress element into Party (subject) element
                                var electronicAddress = subjectParty.ele( 'fc2:ElectronicAddress', { seqNum: seqNum++ } );

                                //Put ElectronicAddressText element into Party (subject) element
                                electronicAddress.ele( 'fc2:ElectronicAddressText' ).text( subject.email );

                                //Put ElectronicAddressTypeCode element into Party (subject) element
                                //Just set to 'E' for email (vs 'u' for website url)
                                electronicAddress.ele( 'fc2:ElectronicAddressTypeCode' ).text( 'E' );
                            }

                            //Increment subject Party (subject) elements count
                            subjectPartyElementsCount++;
                        } );

                        //Put SuspiciousActivity element into Activity element
                        var suspiciousActivity = activityElement.ele( 'fc2:SuspiciousActivity', { seqNum: seqNum++ } );

                        //Put SuspiciousActivityFromDateText element into SuspiciousActivity element
                        //MUST be in the format YYYYMMDD
                        suspiciousActivity.ele( 'fc2:SuspiciousActivityFromDateText' ).text( moment( activity.dateFrom ).format( 'YYYYMMDD' ) );

                        //Put SuspiciousActivityToDateText element into SuspiciousActivity elementv (if exists)
                        //MUST be in the format YYYYMMDD
                        if( !UberSARReport.isMissing( activity.dateTo ) ) {
                            suspiciousActivity.ele( 'fc2:SuspiciousActivityToDateText' ).text( moment( activity.dateTo ).format( 'YYYYMMDD' ) );
                        }

                        //If the amount is not known, put AmountUnknownIndicator element into SuspiciousActivity element
                        if( amountUnknown ){
                            suspiciousActivity.ele( 'fc2:AmountUnknownIndicator' ).text( 'Y' );
                        }

                        //Otherwise if the amount is known and greater than zero
                        else if( amount > 0 ){
                            suspiciousActivity.ele( 'fc2:TotalSuspiciousAmountText' ).text( amount );
                            totalAmount += amount;
                        }

                        //Otherwise amount is known to be zero
                        else{
                            suspiciousActivity.ele( 'fc2:NoAmountInvolvedIndicator' ).text( 'Y' );
                        }

                        //Put SuspiciousActivityClassification element into SuspiciousActivity element
                        var suspiciousActivityClassification = suspiciousActivity.ele( 'fc2:SuspiciousActivityClassification', { seqNum: seqNum++ } );

                        //Find the suspicious activity type code
                        var suspiciousActivityTypeCode;
                        switch( activity.activityType ){
                            case 'structuring':
                                suspiciousActivityTypeCode = '1';
                                break;
                            case 'terroristFinancing':
                                suspiciousActivityTypeCode = '7';
                                break;
                            case 'fraud':
                                suspiciousActivityTypeCode = '3';
                                break;
                            case 'gamingActivities':
                                suspiciousActivityTypeCode = '12';
                                break;
                            case 'moneyLaundering':
                                suspiciousActivityTypeCode = '8';
                                break;
                            case 'identificationDocumentation':
                                suspiciousActivityTypeCode = '4';
                                break;
                            case 'otherSuspiciousActivities':
                                suspiciousActivityTypeCode = '9';
                                break;
                            case 'insurance':
                                suspiciousActivityTypeCode = '5';
                                break;
                            case 'securitiesFuturesOptions':
                                suspiciousActivityTypeCode = '6';
                                break;
                            case 'mortgageFraud':
                                suspiciousActivityTypeCode = '10';
                                break;
                            case 'cyberEvent':
                                suspiciousActivityTypeCode = '11';
                                break;
                            default:

                        }

                        //Make the suspicious activity subtype code
                        var suspiciousActivitySubtypeCode = suspiciousActivityTypeCode + activity.activitySubtype;

                        //Put SuspiciousActivityTypeID element into SuspiciousActivityClassification element
                        suspiciousActivityClassification.ele( 'fc2:SuspiciousActivityTypeID' ).text( suspiciousActivityTypeCode );;

                        //Put SuspiciousActivitySubtypeID element into SuspiciousActivityClassification element
                        suspiciousActivityClassification.ele( 'fc2:SuspiciousActivitySubtypeID' ).text( suspiciousActivitySubtypeCode );;

                        //If we need a subtype code
                        if( suspiciousActivitySubtypeCode === '999' ){

                            //Put OtherSuspiciousActivityTypeText element into SuspiciousActivityClassification element
                            suspiciousActivityClassification.ele( 'fc2:OtherSuspiciousActivityTypeText' ).text( activity.subtypeDescription );
                        }

                        //For each 4000 characters of the narrative text (Each 4000 characters needs to be in it's own sequence block)
                        //Note each sequence block needs a special narrative sequence number
                        var narrativeSeqNum = 1;
                        _.forEach( UberSARReport.chunkString( activity.narrative, 4000 ), function( narrativeTextBlock ){

                            //Put ActivityNarrativeInformation element into Activity element
                            var activityNarrativeInformation = activityElement.ele( 'fc2:ActivityNarrativeInformation', { seqNum: seqNum++ } );

                            //Put ActivityNarrativeSequenceNumber element into ActivityNarrativeInformation element
                            activityNarrativeInformation.ele( 'fc2:ActivityNarrativeSequenceNumber' ).text( narrativeSeqNum++ );

                            //Put ActivityNarrativeText element into ActivityNarrativeInformation element
                            activityNarrativeInformation.ele( 'fc2:ActivityNarrativeText' ).text( narrativeTextBlock );
                        } );

                        activityElementsCount++;
                    } );

                    //Add the top level attributes (including xsi attributes)
                    xml.att( {
                        seqNum: 1,
                        TotalAmount: totalAmount, //Number of US dollars of all suspicious US dollar transaction amounts added up (we added it up above)
                        PartyCount: subjectPartyElementsCount, //Number of subject Party elements (we counted them above)
                        ActivityCount: activityElementsCount, //Number of activity elements in the batch (we counted them above)
                        ActivityAttachmentCount: 0, //Number of activities recording an 'attachment' (we don't use attachments, so 0)
                        AttachmentCount: 0,  //Total number of all 'attachments' recorded (we don't use attachments, so 0)
                        "xsi:schemaLocation": "www.fincen.gov/base/EFL_FinCEN SARXBatchSchema.xsd",
                        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                        "xmlns:fc2": "www.fincen.gov/base"
                    } );

                    //Return the xml as a pretty string
                    return String( xml.end( { pretty: true } ) );
                },

                asciiSAR: function( report, rates ){

                    var maps = [];
                    var sequence = 0;
                    var totalActivities = 0;
                    var totalSubjects = 0;

                    report.raw_data = JSON.parse( report.raw_data );
                    report.raw_data.internal_control_number = "SAR-" + report.name;

                    maps.push( UberSARReport.generateSAR1a( report.raw_data ) );
                    maps.push( UberSARReport.generateSAR2a() );

                    var activitiesCount = 0;
                    for( var i = 0; i < report.raw_data.activities.length; i++ ){
                        var activity = report.raw_data.activities[ i ];
                        sequence++;
                        activitiesCount++;
                        totalActivities++;
                        activity.filing_type = "A";
                        activity.transactions = report.raw_data.transactions;
                        activity.internal_control_number = report.raw_data.internal_control_number;
                        maps.push( UberSARReport.generateSAR2b( report.raw_data ) );
                        maps.push( UberSARReport.generateSAR3a( activity, sequence, rates ) );
                        var subjectsCount = 0;
                        for( var j = 0; j < activity.subjects.length; j++ ){
                            var subject = activity.subjects[ j ];
                            subject = report.raw_data[ subject.array ][ subject.index ];
                            subjectsCount++;
                            totalSubjects++;
                            maps.push( UberSARReport.generateSAR4a( subject, sequence ) );
                            maps.push( UberSARReport.generateSAR4b( subject, sequence ) );
                            if( subject.id_number !== undefined ){
                                maps.push( UberSARReport.generateSAR4c( subject, sequence ) );
                            }

                            maps.push( UberSARReport.generateSAR4e( subject, sequence ) );
                            if( subject.email !== undefined ){
                                maps.push( UberSARReport.generateSAR4f( subject, sequence ) );
                            }
                            maps.push( UberSARReport.generateSAR4h( subject, sequence ) );
                        }
                        var narrativeChunks = UberSARReport.chunkString( activity.narrative, 850 );
                        for( var k = 0; k < narrativeChunks.length; k++ ){
                            activity.narrative = narrativeChunks[ k ];
                            maps.push( UberSARReport.generateSAR5a( activity, sequence ) );
                            if( ( k + 1 ) >= 20 ){
                                break;
                            }
                        }
                        maps.push( UberSARReport.generateSAR9a( subjectsCount ) );
                    }
                    maps.push( UberSARReport.generateSAR9b( activitiesCount, totalSubjects ) );
                    maps.push( UberSARReport.generateSAR9z( totalActivities, totalSubjects ) );

                    return UberSARReport.lineMapsToString( maps );
                },

                generateSAR1a: function( data ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "1A",
                        },
                        transmitter_name: {
                            str_length: 150,
                            start_position: 3,
                            align: "left",
                            value: config_data.name
                        },
                        transmitter_address: {
                            str_length: 100,
                            start_position: 153,
                            align: "left",
                            value: config_data.address
                        },
                        transmitter_city: {
                            str_length: 50,
                            start_position: 253,
                            align: "left",
                            value: config_data.city
                        },
                        transmitter_state: {
                            str_length: 3,
                            start_position: 303,
                            align: "left",
                            value: config_data.state_province
                        },
                        transmitter_postal_code: {
                            str_length: 9,
                            start_position: 306,
                            align: "left",
                            value: config_data.postal_code
                        },
                        transmitter_country: {
                            str_length: 2,
                            start_position: 315,
                            value: config_data.country_code
                        },
                        transmitter_phone: {
                            str_length: 16,
                            start_position: 317,
                            align: "left",
                            value: config_data.phone
                        },
                        transmitter_contact: {
                            str_length: 150,
                            start_position: 333,
                            align: "left",
                            value: config_data.official_contact
                        },
                        transmitter_tin: {
                            str_length: 25,
                            start_position: 483,
                            align: "left",
                            value: config_data.TIN
                        },
                        beginning_date: {
                            str_length: 8,
                            start_position: 508,
                            value: moment( data.date_from ).format( 'MMDDYYYY' )
                        },
                        ending_date: {
                            str_length: 8,
                            start_position: 516,
                            value: moment( data.date_to ).format( 'MMDDYYYY' )
                        },
                        tcc: {
                            str_length: 8,
                            start_position: 524,
                            value: config_data.TCC
                        },
                        filler: {
                            str_length: 669,
                            start_position: 532,
                            value: " "
                        }
                    };

                    return map;
                },

                generateSAR2a: function(){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "2A",
                        },
                        federal_regulator: {
                            str_length: 2,
                            start_position: 3,
                            value: config_data.federal_regulator,
                            align: "left"
                        },
                        institution_name: {
                            str_length: 150,
                            start_position: 5,
                            value: config_data.name,
                            align: "left"
                        },
                        institution_TIN: {
                            str_length: 25,
                            start_position: 155,
                            value: config_data.TIN,
                            align: "left"
                        },
                        institution_TIN_type: {
                            str_length: 1,
                            start_position: 180
                        },
                        institution_type: {
                            str_length: 1,
                            start_position: 181,
                            value: config_data.type_of_institution
                        },
                        institution_type_description: {
                            str_length: 50,
                            start_position: 182,
                            value: config_data.type_of_institution_description,
                            align: "left"
                        },
                        institution_securities_type: {
                            str_length: 13,
                            start_position: 232,
                            value: config_data.securities_type,
                            align: "left"
                        },
                        institution_securities_description: {
                            str_length: 50,
                            start_position: 245,
                            value: config_data.securities_description,
                            align: "left"
                        },
                        institution_financial_identification_type: {
                            str_length: 1,
                            start_position: 295,
                            value: config_data.financial_identification_type
                        },
                        institution_financial_identification_number: {
                            str_length: 20,
                            start_position: 296,
                            value: config_data.financial_identification_number,
                            align: "left"
                        },
                        institution_address: {
                            str_length: 100,
                            start_position: 316,
                            value: config_data.address,
                            align: "left"
                        },
                        institution_city: {
                            str_length: 50,
                            start_position: 416,
                            value: config_data.city,
                            align: "left"
                        },
                        institution_state: {
                            str_length: 3,
                            start_position: 466,
                            value: config_data.state_province,
                            align: "left"
                        },
                        institution_postal_code: {
                            str_length: 9,
                            start_position: 469,
                            value: config_data.postal_code,
                            align: "left"
                        },
                        institution_country: {
                            str_length: 2,
                            start_position: 478,
                            value: config_data.country_code,
                            align: "left"
                        },
                        alternate_name: {
                            str_length: 150,
                            start_position: 480,
                            value: config_data.alternate_name,
                            align: "left"
                        },
                        filler: {
                            str_length: 571,
                            start_position: 630,
                            value: " "
                        }
                    };

                    if( config_data.TIN_type === "EIN" ){
                        map.institution_TIN_type.value = "A";
                    }
                    else if( config_data.TIN_type === "SSN" || config_data.TIN_type === "ITIN" ){
                        map.institution_TIN_type.value = "B";
                    }
                    else{
                        map.institution_TIN_type.value = "C";
                    }

                    return map;
                },

                generateSAR2b: function( data ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "2B"
                        },
                        location_code: {
                            str_length: 10,
                            start_position: 3,
                            value: config_data.location_code,
                            align: "right",
                            padding: 0
                        },
                        type_of_institution: {
                            str_length: 1,
                            start_position: 13,
                            value: config_data.type_of_institution,
                            align: "left"
                        },
                        type_of_institution_description: {
                            str_length: 50,
                            start_position: 14,
                            value: config_data.type_of_institution_description,
                            align: "left"
                        },
                        federal_regulator: {
                            str_length: 2,
                            start_position: 64,
                            value: config_data.federal_regulator,
                            align: "left"
                        },
                        gaming_institution_type: {
                            str_length: 1,
                            start_position: 66,
                            value: config_data.gaming_institution_type
                        },
                        extra_filler: {
                            str_length: 3,
                            start_position: 67,
                            value: " "
                        },
                        gaming_institution_description: {
                            str_length: 50,
                            start_position: 70,
                            value: config_data.gaming_institution_type_description,
                            align: "left"
                        },
                        type_of_securities: {
                            str_length: 10,
                            start_position: 120,
                            value: config_data.securities_type,
                            align: "left"
                        },
                        securities_description: {
                            str_length: 50,
                            start_position: 130,
                            value: config_data.securities_description,
                            align: "left"
                        },
                        financial_id_type: {
                            str_length: 1,
                            start_position: 180,
                            value: config_data.institution_id_type
                        },
                        financial_id_num: {
                            str_length: 20,
                            start_position: 181,
                            value: config_data.institution_id_number,
                            align: "left"
                        },
                        institution_role: {
                            str_length: 1,
                            start_position: 201,
                            value: config_data.institution_role
                        },
                        institution_name: {
                            str_length: 151,
                            start_position: 202,
                            value: config_data.name,
                            align: "left"
                        },
                        alternate_name: {
                            str_length: 150,
                            start_position: 353,
                            value: config_data.alternate_name,
                            align: "left"
                        },
                        institution_TIN: {
                            str_length: 26,
                            start_position: 503,
                            value: config_data.TIN,
                            align: "left"
                        },
                        institution_TIN_type: {
                            str_length: 1,
                            start_position: 529,
                            value: " "
                        },
                        address: {
                            str_length: 101,
                            start_position: 530,
                            value: config_data.address,
                            align: "left"
                        },
                        city: {
                            str_length: 51,
                            start_position: 631,
                            value: config_data.city,
                            align: "left"
                        },
                        state: {
                            str_length: 3,
                            start_position: 682,
                            value: config_data.state_province,
                            align: "left"
                        },
                        postal_code: {
                            str_length: 10,
                            start_position: 685,
                            value: config_data.postal_code,
                            align: "left"
                        },
                        country: {
                            str_length: 3,
                            start_position: 695,
                            value: config_data.country_code,
                            align: "left"
                        },
                        internal_control_number: {
                            str_length: 20,
                            start_position: 698,
                            value: data.internal_control_number,
                            align: "left"
                        },
                        amount: {
                            str_length: 15,
                            start_position: 718,
                            value: " ",
                            align: "left"
                        },
                        branch_office: {
                            str_length: 1,
                            start_position: 733,
                            value: "X"
                        },
                        filler: {
                            str_length: 467,
                            start_position: 734,
                            value: " "
                        }
                    };

                    if( config_data.TIN_type === "EIN" ){
                        map.institution_TIN_type.value = "A";
                    }
                    else if( config_data.TIN_type === "SSN" || config_data.TIN_type === "ITIN" ){
                        map.institution_TIN_type.value = "B";
                    }
                    else{
                        map.institution_TIN_type.value = "C";
                    }

                    return map;
                },


                generateSAR3a: function( data, sequence_number, rates ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "3A"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        attachment: {
                            str_length: 1,
                            start_position: 8,
                            value: " "
                        },
                        filing_type: {
                            str_length: 1,
                            start_position: 9,
                            value: "A"
                        },
                        continuing_activity: {
                            str_length: 2,
                            start_position: 10,
                            align: "left",
                            value: " "
                        },
                        document_number: {
                            str_length: 14,
                            start_position: 12,
                            value: " ",
                            align: 'left'
                        },
                        amount: {
                            str_length: 15,
                            start_position: 26,
                            align: "left"
                        },
                        amount_unknown: {
                            str_length: 1,
                            start_position: 41,
                            value: " "
                        },
                        date_from: {
                            str_length: 8,
                            start_position: 42,
                            value: " "
                        },
                        date_to: {
                            str_length: 8,
                            start_position: 50,
                            value: " "
                        },
                        cumulative_amount: {
                            str_length: 15,
                            start_position: 58,
                            align: "left",
                            value: " "
                        },
                        structuring: {
                            str_length: 7,
                            start_position: 73,
                            align: "left",
                            value: " "
                        },
                        structuring_description: {
                            str_length: 50,
                            start_position: 80,
                            align: "left",
                            value: " "
                        },
                        terrorist_financing: {
                            str_length: 2,
                            start_position: 130,
                            align: "left",
                            value: " "
                        },
                        terrorist_financing_description: {
                            str_length: 50,
                            start_position: 132,
                            align: "left",
                            value: " "
                        },
                        fraud: {
                            str_length: 11,
                            start_position: 182,
                            align: "left",
                            value: " "
                        },
                        fraud_description: {
                            str_length: 50,
                            start_position: 193,
                            align: "left",
                            value: " "
                        },
                        casinos: {
                            str_length: 5,
                            start_position: 243,
                            align: "left",
                            value: " "
                        },
                        casinos_description: {
                            str_length: 50,
                            start_position: 248,
                            align: "left",
                            value: " "
                        },
                        money_laundering: {
                            str_length: 13,
                            start_position: 298,
                            align: "left",
                            value: " "
                        },
                        money_laundering_description: {
                            str_length: 50,
                            start_position: 311,
                            align: "left",
                            value: " "
                        },
                        identification: {
                            str_length: 6,
                            start_position: 361,
                            align: "left",
                            value: " "
                        },
                        identification_description: {
                            str_length: 50,
                            start_position: 367,
                            align: "left",
                            value: " "
                        },
                        other_suspicious: {
                            str_length: 19,
                            start_position: 417,
                            align: "left",
                            value: " "
                        },
                        other_suspicious_description: {
                            str_length: 50,
                            start_position: 436,
                            align: "left",
                            value: " "
                        },
                        insurance: {
                            str_length: 7,
                            start_position: 486,
                            align: "left",
                            value: " "
                        },
                        insurance_description: {
                            str_length: 50,
                            start_position: 493,
                            align: "left",
                            value: " "
                        },
                        securities: {
                            str_length: 5,
                            start_position: 543,
                            align: "left",
                            value: " "
                        },
                        securities_description: {
                            str_length: 50,
                            start_position: 548,
                            align: "left",
                            value: " "
                        },
                        mortgage_fraud: {
                            str_length: 5,
                            start_position: 598,
                            align: "left",
                            value: " "
                        },
                        mortgage_fraud_description: {
                            str_length: 50,
                            start_position: 603,
                            align: "left",
                            value: " "
                        },
                        product: {
                            str_length: 20,
                            start_position: 653,
                            align: "left",
                            value: " "
                        },
                        product_description: {
                            str_length: 50,
                            start_position: 673,
                            align: "left",
                            value: " "
                        },
                        instrument: {
                            str_length: 10,
                            start_position: 723,
                            align: "left",
                            value: " "
                        },
                        instrument_description: {
                            str_length: 50,
                            start_position: 733,
                            align: "left",
                            value: " "
                        },
                        le_contact_agency: {
                            str_length: 150,
                            start_position: 783,
                            align: "left",
                            value: " "
                        },
                        le_contact_name: {
                            str_length: 150,
                            start_position: 933,
                            align: "left",
                            value: " "
                        },
                        le_contact_telephone: {
                            str_length: 16,
                            start_position: 1083,
                            align: "left",
                            value: " "
                        },
                        le_contact_telephone_extension: {
                            str_length: 6,
                            start_position: 1099,
                            align: "left",
                            value: " "
                        },
                        le_contact_date: {
                            str_length: 8,
                            start_position: 1105,
                            align: "left",
                            value: " "
                        },
                        institution_contact_office: {
                            str_length: 10,
                            start_position: 1113,
                            align: "left",
                            value: "Main"
                        },
                        institution_telephone: {
                            str_length: 16,
                            start_position: 1123,
                            align: "left",
                            value: config_data.phone
                        },
                        institution_telephone_extension: {
                            str_length: 6,
                            start_position: 1139,
                            align: "left",
                            value: " "
                        },
                        date_filed: {
                            str_length: 8,
                            start_position: 1145,
                            value: moment.utc().format( 'MMDDYYYY' )
                        },
                        internal_control_number: {
                            str_length: 20,
                            start_position: 1153,
                            value: data.internal_control_number,
                            align: "left"
                        },
                        filler: {
                            str_length: 28,
                            start_position: 1173
                        }
                    };

                    switch( data.activityType ){
                        case 'structuring':
                            switch( data.activitySubtype ){
                                case '11':
                                    data.structuring = 'A';
                                    break;
                                case '12':
                                    data.structuring = 'B';
                                    break;
                                case '06':
                                    data.structuring = 'C';
                                    break;
                                case '13':
                                    data.structuring = 'D';
                                    break;
                                case '14':
                                    data.structuring = 'E';
                                    break;
                                case '999':
                                    data.structuring = 'Z';
                                    data.structuring_description = data.subtypeDescription;
                                default:
                            }
                            break;
                        case 'terroristFinancing':
                            switch( data.activitySubtype ){
                                case '01':
                                    data.terrorist_financing = 'A';
                                    break;
                                case '999':
                                    data.terrorist_financing = 'Z';
                                    data.terrorist_financing_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'fraud':
                            switch( data.activitySubtype ){
                                case '20':
                                    data.fraud = 'A';
                                    break;
                                case '22':
                                    data.fraud = 'Z';
                                    data.fraud_description = 'Advance fee';
                                    break;
                                case '21':
                                    data.fraud = 'B';
                                    break;
                                case '01':
                                    data.fraud = 'C';
                                    break;
                                case '04':
                                    data.fraud = 'D';
                                    break;
                                case '05':
                                    data.fraud = 'E';
                                    break;
                                case '23':
                                    data.fraud = 'F';
                                    break;
                                case '08':
                                    data.fraud = 'G';
                                    break;
                                case '09':
                                    data.fraud = 'H';
                                    break;
                                case '24':
                                    data.fraud = 'Z';
                                    data.fraud_description = 'Ponzi Scheme';
                                    break;
                                case '10':
                                    data.fraud = 'I';
                                    break;
                                case '25':
                                    data.fraud = 'Z';
                                    data.fraud_description = 'Securities fraud';
                                    break;
                                case '12':
                                    data.fraud = 'J';
                                    break;
                                case '999':
                                    data.fraud = 'Z';
                                    data.fraud_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'gamingActivities':
                            switch( data.activitySubtype ){
                                case '01':
                                    data.casinos = 'Z';
                                    data.casinos_description = 'Chip Walking';
                                    break;
                                case '02':
                                    data.casinos = 'B';
                                    break;
                                case '03':
                                    data.casinos = 'C';
                                    break;
                                case '04':
                                    data.casinos = 'Z';
                                    data.casinos_description = 'Unknown source of chips';
                                    break;
                                case '999':
                                    data.casinos = 'Z';
                                    data.casinos_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'moneyLaundering':
                            switch( data.activitySubtype ){
                                case '01':
                                    data.money_laundering = 'A';
                                    break;
                                case '24':
                                    data.money_laundering = 'Z';
                                    data.money_laundering_description = 'Funnel account';
                                    break;
                                case '20':
                                    data.money_laundering = 'B';
                                    break;
                                case '21':
                                    data.money_laundering = 'C';
                                    break;
                                case '04':
                                    data.money_laundering = 'D';
                                    break;
                                case '05':
                                    data.money_laundering = 'E';
                                    break;
                                case '22':
                                    data.money_laundering = 'F';
                                    break;
                                case '06':
                                    data.money_laundering = 'G';
                                    break;
                                case '07':
                                    data.money_laundering = 'H';
                                    break;
                                case '08':
                                    data.money_laundering = 'I';
                                    break;
                                case '09':
                                    data.money_laundering = 'J';
                                    break;
                                case '23':
                                    data.money_laundering = 'K';
                                    break;
                                case '12':
                                    data.money_laundering = 'L';
                                    break;
                                case '999':
                                    data.money_laundering = 'Z';
                                    data.money_laundering_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'identificationDocumentation':
                            switch( data.activitySubtype ){
                                case '01':
                                    data.identification = 'A';
                                    break;
                                case '02':
                                    data.identification = 'B';
                                    break;
                                case '03':
                                    data.identification = 'C';
                                    break;
                                case '09':
                                    data.identification = 'Z';
                                    data.identification_description = 'Provided questionable or false identification';
                                    break;
                                case '04':
                                    data.identification = 'D';
                                    break;
                                case '05':
                                    data.identification = 'E';
                                    break;
                                case '999':
                                    data.identification = 'Z';
                                    data.identification_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'otherSuspiciousActivities':
                            switch( data.activitySubtype ){
                                case '20':
                                    data.other_suspicious = 'A';
                                    break;
                                case '01':
                                    data.other_suspicious = 'B';
                                    break;
                                case '17':
                                    data.other_suspicious = 'C';
                                    break;
                                case '21':
                                    data.other_suspicious = 'D';
                                    break;
                                case '03':
                                    data.other_suspicious = 'E';
                                    break;
                                case '04':
                                    data.other_suspicious = 'F';
                                    break;
                                case '26':
                                    data.other_suspicious = 'Z';
                                    data.other_suspicious_description = 'Human smuggling';
                                    break;
                                case '27':
                                    data.other_suspicious = 'Z';
                                    data.other_suspicious_description = 'Human trafficking';
                                    break;
                                case '05':
                                    data.other_suspicious = 'G';
                                    break;
                                case '22':
                                    data.other_suspicious = 'H';
                                    break;
                                case '24':
                                    data.other_suspicious = 'J';
                                    break;
                                case '07':
                                    data.other_suspicious = 'K';
                                    break;
                                case '08':
                                    data.other_suspicious = 'L';
                                    break;
                                case '09':
                                    data.other_suspicious = 'M';
                                    break;
                                case '10':
                                    data.other_suspicious = 'N';
                                    break;
                                case '25':
                                    data.other_suspicious = 'O';
                                    break;
                                case '28':
                                    data.other_suspicious = 'Z';
                                    data.other_suspicious_description = 'Transaction(s) involving foreign high risk jurisdiction';
                                    break;
                                case '11':
                                    data.other_suspicious = 'P';
                                    break;
                                case '13':
                                    data.other_suspicious = 'R';
                                    break;
                                case '999':
                                    data.other_suspicious = 'Z';
                                    data.other_suspicious_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'insurance':
                            switch( data.activitySubtype ){
                                case '01':
                                    data.insurance = 'A';
                                    break;
                                case '02':
                                    data.insurance = 'B';
                                    break;
                                case '04':
                                    data.insurance = 'C';
                                    break;
                                case '05':
                                    data.insurance = 'D';
                                    break;
                                case '06':
                                    data.insurance = 'E';
                                    break;
                                case '07':
                                    data.insurance = 'F';
                                    break;
                                case '999':
                                    data.insurance = 'Z';
                                    data.insurance_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'securitiesFuturesOptions':
                            switch( data.activitySubtype ){
                                case '01':
                                    data.securities = 'A';
                                    break;
                                case '08':
                                    data.securities = 'B';
                                    break;
                                case '03':
                                    data.securities = 'C';
                                    break;
                                case '04':
                                    data.securities = 'D';
                                    break;
                                case '09':
                                    data.securities = 'Z';
                                    data.securities_description = 'Wash trading';
                                    break;
                                case '999':
                                    data.securities = 'Z';
                                    data.securities_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'mortgageFraud':
                            switch( data.activitySubtype ){
                                case '05':
                                    data.mortgage_fraud = 'Z';
                                    data.mortgage_fraud_description = 'Application fraud';
                                    break;
                                case '01':
                                    data.mortgage_fraud = 'A';
                                    break;
                                case '06':
                                    data.mortgage_fraud = 'B';
                                    break;
                                case '03':
                                    data.mortgage_fraud = 'C';
                                    break;
                                case '07':
                                    data.mortgage_fraud = 'Z';
                                    data.mortgage_fraud_description = 'Origination fraud';
                                    break;
                                case '999':
                                    data.mortgage_fraud = 'Z';
                                    data.mortgage_fraud_description = data.subtypeDescription;
                                    break;
                                default:
                            }
                            break;
                        case 'cyberEvent':
                            data.other_suspicious = 'Z';
                            switch( data.activitySubtype ){
                                case '01':
                                    data.other_suspicious_description = 'Cyber event against financial institution(s)';
                                case '02':
                                    data.other_suspicious_description = 'Cyber event against financial institution customer(s)';
                                case '999':
                                    data.other_suspicious_description = data.subtypeDescription;
                            }
                            break;
                        default:
                    }

                    if( !_.isEmpty( data.dateFrom ) ){
                        data.date_from = data.dateFrom;
                    }
                    if( !_.isEmpty( data.dateTo ) ){
                        data.date_to = data.dateTo;
                    }

                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){

                            if( key === "date_from" || key === "date_to" ){
                                map[ key ].value = moment.utc( data[ key ] ).format( 'MMDDYYYY' );
                            } else{
                                map[ key ].value = data[ key ];
                            }

                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    if( data.filing_type === "C" ){
                        map.continuing_activity.value = data.filing_type;
                        map.document_number.value = 0;
                        map.document_number.padding = 0;
                    }

                    if( data.transactions.length > 0 ){
                        map.amount.value = 0;
                        _.forEach( data.transactions, function( transaction ){
                            var baseRate = 1;
                            if( transaction.type === "Wire" ){
                                if( transaction.currency_id !== "USD" ){
                                    baseRate = baseRate / rates[ transaction.currency_id ];
                                    map.amount.value += (transaction.amount * (baseRate / rates[ transaction.currency_id ]));
                                }
                                else{
                                    map.amount.value += transaction.amount;
                                }
                            }
                            else if( transaction.type === "FXRequest" ){
                                if( transaction.counter_currency_id !== "USD" ){
                                    baseRate = baseRate / rates[ transaction.counter_currency_id ];
                                    map.amount.value += ( transaction.counter_amount * (baseRate / rates[ transaction.counter_currency_id ]));
                                }
                                else{
                                    map.amount.value += transaction.counter_amount;

                                }
                            }
                        } );
                        map.amount.value = math.round( Number( map.amount.value ) );
                        map.amount.padding = 0;
                        map.amount.align = "right";
                        map.amount_unknown.value = " ";
                    }
                    else{
                        map.amount_unknown.value = "B";
                        map.amount.value = "";

                    }

                    return map;
                },


                generateSAR4a: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "4A"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        is_entity: {
                            str_length: 1,
                            start_position: 8
                        },
                        critical_information_unknown: {
                            str_length: 1,
                            start_position: 9,
                            value: " "
                        },
                        name: {
                            str_length: 150,
                            start_position: 10,
                            align: "left"
                        },
                        name_unknown: {
                            str_length: 1,
                            start_position: 160,
                            value: " "
                        },
                        first_name: {
                            str_length: 35,
                            start_position: 161,
                            align: "left"
                        },
                        first_name_unknown: {
                            str_length: 1,
                            start_position: 196,
                            value: " "
                        },
                        middle_name: {
                            str_length: 35,
                            start_position: 197,
                            align: "left"
                        },
                        suffix: {
                            str_length: 35,
                            start_position: 232,
                            align: "left"
                        },
                        gender: {
                            str_length: 1,
                            start_position: 267
                        },

                        type_of_business: {
                            str_length: 30,
                            start_position: 268,
                            align: "left"
                        },
                        naics_code: {
                            str_length: 6,
                            start_position: 298,
                            align: "left",
                            value: " "
                        },
                        tin: {
                            str_length: 25,
                            start_position: 304,
                            align: "left"
                        },
                        tin_unknown: {
                            str_length: 1,
                            start_position: 329,
                            align: "left",
                            value: " "
                        },
                        tin_type: {
                            str_length: 1,
                            start_position: 330
                        },
                        form_of_identification: {
                            str_length: 1,
                            start_position: 331
                        },
                        date_of_birth: {
                            str_length: 8,
                            start_position: 332
                        },
                        date_of_birth_unknown: {
                            str_length: 1,
                            start_position: 340
                        },
                        corroborative: {
                            str_length: 1,
                            start_position: 341,
                            value: "B"
                        },
                        no_known_account: {
                            str_length: 1,
                            start_position: 342,
                            value: " "
                        },
                        subject_role: {
                            str_length: 1,
                            start_position: 343
                        },
                        filler: {
                            str_length: 857,
                            start_position: 344
                        }
                    };


                    if( data.account_type === "business" ){
                        map.is_entity.value = "A";
                    }
                    else{
                        map.is_entity.value = " ";
                    }

                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){
                            if(data[key].length > map[key].str_length){
                                data[key] = data[key].substring(0, map[key].str_length);
                            }

                            map[ key ].value = data[ key ];
                            if( key === "tin_type" ){
                                if( data[ key ] === "EIN" ){
                                    map[ key ].value = "A";
                                }
                                else if( data[ key ] === "SSN" || data[ key ] === "TIN" ){
                                    map[ key ].value = "B";
                                }
                                else{
                                    map[ key ].value = "C";
                                }
                            }
                            if( key === "date_of_birth" ){
                                if( _.isString( map[ key ] ) ) {
                                    map[ key ].value = moment( data[ key ] ).format( 'MMDDYYYY' );
                                }
                            }
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    if( data.first_name === undefined ){
                        map.first_name_unknown.value = "X";
                    }
                    if( data.tin === undefined ){
                        map.tin_unknown.value = "X";
                    }

                    return map;
                },


                generateSAR4b: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "4B"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        address: {
                            str_length: 100,
                            start_position: 8,
                            align: "left"
                        },
                        address_unknown: {
                            str_length: 1,
                            start_position: 108,
                            align: "left"
                        },
                        city: {
                            str_length: 50,
                            start_position: 109,
                            align: "left"
                        },
                        city_unknown: {
                            str_length: 1,
                            start_position: 159,
                            align: "left"
                        },
                        state_province: {
                            str_length: 3,
                            start_position: 160,
                            align: "left",
                            value: " "
                        },
                        state_province_unknown: {
                            str_length: 1,
                            start_position: 163,
                            align: "left",
                            value: " "
                        },
                        postal_code: {
                            str_length: 9,
                            start_position: 164,
                            align: "left"
                        },
                        postal_code_unknown: {
                            str_length: 1,
                            start_position: 173,
                            align: "left",
                            value: " "
                        },
                        country: {
                            str_length: 2,
                            start_position: 174,
                            align: "left"
                        },
                        country_unknown: {
                            str_length: 1,
                            start_position: 176,
                            align: "left"
                        },
                        filler: {
                            str_length: 1024,
                            start_position: 177
                        }
                    };


                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){
                            if( data[ key ].length > map[ key ].str_length ){
                                data[ key ] = data[ key ].substring( 0, map[ key ].str_length );
                            }
                            map[ key ].value = data[ key ];
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    if( map.address.value === " " ){
                        map.address_unknown.value = "X";
                    }

                    if( map.city.value === " " ){
                        map.city_unknown.value = "X";
                    }

                    if( map.state_province.value === " " ){
                        map.state_province_unknown.value = "X";
                    }

                    if( map.postal_code.value === " " ){
                        map.postal_code_unknown.value = "X";
                    }
                    if( map.country.value === " " ){
                        map.country_unknown.value = "X";
                    }

                    return map;
                },

                generateSAR4c: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "4C"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        id_type: {
                            str_length: 1,
                            start_position: 8
                        },
                        id_number: {
                            str_length: 24,
                            start_position: 9,
                            align: "left"
                        },
                        id_issuing_state: {
                            str_length: 3,
                            start_position: 33,
                            align: "left"
                        },
                        id_country: {
                            str_length: 2,
                            start_position: 36
                        },
                        id_type_description: {
                            str_length: 50,
                            start_position: 38,
                            align: 'left'
                        },
                        filler: {
                            str_length: 1113,
                            start_position: 88
                        }
                    };

                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){

                            if( key === "id_type" ){
                                if( data[ key ] === "PID" ){
                                    map[ key ].value = "B"
                                }
                                else if( data[ key ] === "SSN/TIN" || data[ key ] === "EIN" || data[ key ] === "NID" ){
                                    map[ key ].value = "Z";
                                    map.id_type_description = data[ key ];
                                }
                            }

                            if( key !== "id_type" ){
                                if( data[ key ].length > map[ key ].str_length ){
                                    data[ key ] = data[ key ].substring( 0, map[ key ].str_length );
                                }
                                map[ key ].value = data[ key ];
                            }
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    return map;
                },

                generateSAR4e: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "4E"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        phone_type: {
                            str_length: 1,
                            start_position: 8,
                            value: " "
                        },
                        phone: {
                            str_length: 16,
                            start_position: 9,
                            align: "left"
                        },
                        phone_extension: {
                            str_length: 6,
                            start_position: 25,
                            align: 'left'
                        },

                        filler: {
                            str_length: 1170,
                            start_position: 31
                        }
                    };


                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){
                            if(data[key].length > map[key].str_length){
                               data[key] = data[key].substring(0, map[key].str_length);
                            }
                            map[ key ].value = data[ key ];
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }

                    }

                    if( map.phone.value.indexOf( "+" ) !== -1 ){
                        map.phone.value = map.phone.value.replace( "+", "" )
                    }
                    if( map.phone.value.indexOf( "(" ) !== -1 ){
                        map.phone.value = map.phone.value.replace( "(", "" )
                    }
                    if( map.phone.value.indexOf( ")" ) !== -1 ){
                        map.phone.value = map.phone.value.replace( ")", "" )
                    }
                    if( map.phone.value.indexOf( "-" ) !== -1 ){
                        map.phone.value = map.phone.value.replace( "-", "" )
                    }
                    if( map.phone.value.indexOf( " " ) !== -1 ){
                        map.phone.value = map.phone.value.replace( " ", "" )
                    }

                    return map;
                },

                generateSAR4f: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "4F"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        email: {
                            str_length: 50,
                            start_position: 8,
                            align: "left"
                        },
                        filler: {
                            str_length: 1143,
                            start_position: 58
                        }
                    };

                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){
                            if(data[key].length > map[key].str_length){
                                data[key] = data[key].substring(0, map[key].str_length);
                            }
                            map[ key ].value = data[ key ];
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    return map;
                },

                generateSAR4h: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "4H"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        institution_tin: {
                            str_length: 25,
                            start_position: 8,
                            align: "left",
                            value: config_data.institution_TIN
                        },
                        relationship_to_institution: {
                            str_length: 62,
                            start_position: 33,
                            align: "left",
                            value: "G"
                        },
                        status_of_relationship: {
                            str_length: 1,
                            start_position: 95,
                            value: " "
                        },
                        action_date: {
                            str_length: 8,
                            start_position: 96,
                            align: "left",
                            value: " "
                        },
                        filler: {
                            str_length: 1097,
                            start_position: 104
                        }
                    };

                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){
                            if(data[key].length > map[key].str_length){
                                data[key] = data[key].substring(0, map[key].str_length);
                            }
                            map[ key ].value = data[ key ];
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    return map;
                },

                generateSAR5a: function( data, sequence_number ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "5A"
                        },
                        transaction_sequence_number: {
                            str_length: 5,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: sequence_number
                        },
                        narrative: {
                            str_length: 850,
                            start_position: 8,
                            align: "left"
                        },
                        filler: {
                            str_length: 343,
                            start_position: 858
                        }
                    };

                    for( var key in map ){
                        if( data.hasOwnProperty( key ) && data[ key ] !== null ){
                            if(data[key].length > map[key].str_length){
                                data[key] = data[key].substring(0, map[key].str_length);
                            }
                            map[ key ].value = data[ key ];
                        }
                        else{
                            if( map[ key ].value === undefined ){
                                map[ key ].value = " ";
                            }
                        }
                    }

                    return map;
                },

                generateSAR9a: function( subjects_count ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "9A"
                        },
                        threeA_report_count: {
                            str_length: 7,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: 1
                        },
                        fourA_report_count: {
                            str_length: 7,
                            start_position: 10,
                            value: subjects_count,
                            padding: 0,
                            align: "right"
                        },
                        fiveA_report_count: {
                            str_length: 7,
                            start_position: 17,
                            align: "right",
                            padding: 0,
                            value: 1
                        },
                        twoC_report_count: {
                            str_length: 7,
                            start_position: 24,
                            align: "right",
                            padding: 0,
                            value: 0
                        },
                        filler: {
                            str_length: 1170,
                            start_position: 31,
                            value: " "
                        }
                    };

                    return map;
                },

                generateSAR9b: function( total_count, subjects_count ){
                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "9B"
                        },
                        twoB_report_count: {
                            str_length: 7,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: total_count
                        },
                        threeA_report_count: {
                            str_length: 7,
                            start_position: 10,
                            align: "right",
                            padding: 0,
                            value: total_count
                        },
                        fourA_report_count: {
                            str_length: 7,
                            start_position: 17,
                            align: "right",
                            padding: 0,
                            value: subjects_count
                        },
                        fiveA_report_count: {
                            str_length: 7,
                            start_position: 24,
                            align: "right",
                            padding: 0,
                            value: total_count
                        },
                        twoC_report_count: {
                            str_length: 7,
                            start_position: 31,
                            align: "right",
                            padding: 0,
                            value: 0
                        },
                        filler: {
                            str_length: 1163,
                            start_position: 38,
                            value: " "
                        }
                    };

                    return map;
                },


                generateSAR9z: function( total_count, subjects_count ){

                    var map = {
                        record_type: {
                            str_length: 2,
                            start_position: 1,
                            value: "9Z"
                        },
                        twoA_report_count: {
                            str_length: 7,
                            start_position: 3,
                            align: "right",
                            padding: 0,
                            value: 1
                        },
                        twoB_report_count: {
                            str_length: 7,
                            start_position: 10,
                            align: "right",
                            padding: 0,
                            value: total_count
                        },
                        threeA_report_count: {
                            str_length: 7,
                            start_position: 17,
                            align: "right",
                            padding: 0,
                            value: total_count
                        },
                        fourA_report_count: {
                            str_length: 7,
                            start_position: 24,
                            align: "right",
                            padding: 0,
                            value: subjects_count
                        },
                        fiveA_report_count: {
                            str_length: 7,
                            start_position: 31,
                            align: "right",
                            padding: 0,
                            value: total_count
                        },
                        twoC_report_count: {
                            str_length: 7,
                            start_position: 38,
                            align: "right",
                            padding: 0,
                            value: 0
                        },
                        attachment_count: {
                            str_length: 7,
                            start_position: 45,
                            align: "right",
                            padding: 0,
                            value: 0
                        },
                        filler: {
                            str_length: 1149,
                            start_position: 52,
                            value: " "
                        }
                    };

                    return map;
                },

                getECBRates: function( base ){
                    return new Promise( function( resolve, reject ){
                        var baseCurrency = 'USD';
                        if( !_.isEmpty( base ) ){
                            baseCurrency = base;
                        }

                        var rates = {};

                        // Temporary function which returns daily FX rates from ECB. Base currency is EUR;
                        request( {
                                method: 'GET',
                                url: 'http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
                            },
                            function( error, response, body ){
                                if( !!error ){
                                    res.send( 400, {} );
                                    return next();
                                }
                                else{
                                    var ecbData = xmlParser.toJson( body, { object: true } );
                                    var ecbRates = ecbData[ 'gesmes:Envelope' ][ 'Cube' ][ 'Cube' ][ 'Cube' ];
                                    ecbRates.push( { currency: 'EUR', rate: '1.00' } ); //ECB rate base is EURO

                                    _.forEach( ecbRates, function( ecbR ){
                                        rates[ ecbR.currency ] = Number( ecbR.rate );
                                    } );

                                    var baseRates = {};
                                    // Convert everything to be based in BASE currency
                                    _.forEach( rates, function( rate, key ){
                                        baseRates[ key ] = math.round( rate / rates[ baseCurrency ], 6 );
                                    } );

                                    resolve( baseRates );
                                }
                            }
                        );
                    } );
                },

                lineMapToString: function( map ){
                    var finalString = "";

                    for( var key in map ){
                        var string = "";
                        if( map[ key ].hasOwnProperty( 'align' ) ){
                            if( map[ key ].align === "left" ){
                                if( map[ key ].hasOwnProperty( "padding" ) ){
                                    string += map[ key ].value;
                                    string = padEnd( string, map[ key ].str_length, map[ key ].padding );
                                }
                                else{
                                    string += map[ key ].value;
                                    string = padEnd( string, map[ key ].str_length );
                                }
                            }
                            else if( map[ key ].align === "right" ){
                                if( map[ key ].hasOwnProperty( "padding" ) ){
                                    string += map[ key ].value;
                                    string = padStart( string, map[ key ].str_length, map[ key ].padding );
                                }
                                else{
                                    string += map[ key ].value;
                                    string = padStart( string, map[ key ].str_length );
                                }
                            }
                        }
                        else{
                            if( map[ key ].value === " " ){
                                string += padEnd( " ", map[ key ].str_length );
                            }
                            else{
                                string += map[ key ].value
                            }
                        }
                        finalString = finalString.substr( 0, map[ key ].start_position - 1 ) + string + finalString.substr( map[ key ].start_position - 1 );
                    }

                    return finalString;
                },

                lineMapsToString: function( maps ){
                    var outputString = "";
                    _.forEach( maps, function( map ){
                        outputString += UberSARReport.lineMapToString( map ) + "\r\n";
                    } );
                    return outputString;
                },

                chunkString: function( string, size ){
                    return string.match( new RegExp( '.{1,' + size + '}', 'g' ) );
                },

                isMissing: function( value ){
                    if ( typeof value != "undefined" ){
                        return value == null || value == "";
                    }
                    else return true;
                },

                anyMissing: function( values ){
                    for( var e in values ) {
                        if ( UberSARReport.isMissing( values[ e ] ) ){
                            return true;
                        }
                    }
                    return false;
                }
            }
        } );

    return UberSARReport;
};
