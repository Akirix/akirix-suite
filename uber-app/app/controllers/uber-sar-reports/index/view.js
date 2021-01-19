import Ember from 'ember';
import EmberValidations from 'ember-validations';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, DirtyCheckRouteMixin, {
    needs: [ 'application' ],

    readyToLookup: true,

    lookedUp: true,

    hasLookupError: false,

    lookupError: "",

    filingTypes: [
        { label: 'Initial Report', val: 'init' },
        { label: 'Continued Report', val: 'cont' },
        { label: 'Amended Report', val: 'amend' }
    ],

    transactionTypes: [
        { label: 'Wire/ACH', val: 'wires' },
        { label: 'Foreign Exchange', val: 'fxRequests' }
    ],

    amountChoices: [
        { label: 'Amount Involved', val: "C" },
        { label: 'No Amount Involved', val: "B" },
        { label: 'Amount Unknown', val: "A" },
    ],

    transactionTypeWatcher: function(){
        if( !!this.get( 'transaction_type' ) ) {
            this.set( 'readyToLookup', true );
        }
        else{
            this.set( 'readyToLookup', false );
        }
    }.observes( 'transaction_type' ),

    amountWatcher: function(){
        if( this.get( 'uberSarReport.amount_unknown' ) === "C" ){
            this.set( 'amountUnknown', true );
        }
        else{
            this.set( 'amountUnknown', false );
        }
    }.observes( 'uberSarReport.amount_unknown' ),

    actions: {
        saveReport: function(){
            var self = this;

            var report = this.get( 'model' );
            var uberSarReport = self.get( 'uberSarReport' );

            var rawData = {
                transactions: uberSarReport.transactions,
                transactionSubjects: uberSarReport.transactionSubjects,
                addedSubjects: uberSarReport.addedSubjects,
                activities: uberSarReport.activities
            };

            var activities = Ember.A();
            rawData.activities.forEach( function( activity ){
                var subjects = Ember.A();
                activity.subjects.forEach( function( subject ){
                    subjects.pushObject( uberSarReport.findArrayAndIndex( subject ) );
                } );
                activities.pushObject( {
                    dateFrom: activity.dateFrom,
                    dateTo: activity.dateTo,
                    activityType: activity.activityType,
                    activitySubtype: activity.activitySubtype,
                    subtypeDescription: activity.subtypeDescription,
                    narrative: activity.narrative,
                    subjects: subjects
                } );
            } );
            rawData.activities = activities;

            report.setProperties( {
                'raw_data': JSON.stringify( rawData ),
                'uber_user_id': uberSarReport.uber_user_id,
                'notes': uberSarReport.notes
            } );

            report.save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Suspicious Activity Report Updated', { closeAfter: 5000 } );

                    var route = self.container.lookup( 'route:uber-sar-reports' );
                    route.refresh();
                    self.transitionToRoute( 'uber-sar-reports' );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );

                    self.set( 'isLocked', false );
                }
            );
        },

        sendReport: function(){
            var self = this;

            var report = this.get( 'model' );
            var uberSarReport = self.get( 'uberSarReport' );

            var rawData = {
                transactions: self.get( 'uberSarReport' ).transactions,
                transactionSubjects: self.get( 'uberSarReport' ).transactionSubjects,
                addedSubjects: self.get( 'uberSarReport' ).addedSubjects,
                activities: self.get( 'uberSarReport' ).activities
            };

            var activities = Ember.A();
            rawData.activities.forEach( function( activity ){
                var subjects = Ember.A();
                activity.subjects.forEach( function( subject ){
                    subjects.pushObject( self.get( 'uberSarReport' ).findArrayAndIndex( subject ) );
                } );
                activities.pushObject( {
                    dateFrom: activity.dateFrom,
                    dateTo: activity.dateTo,
                    activityType: activity.activityType,
                    activitySubtype: activity.activitySubtype,
                    subtypeDescription: activity.subtypeDescription,
                    narrative: activity.narrative,
                    subjects: subjects
                } );
            } );
            rawData.activities = activities;

            report.setProperties( {
                'raw_data': JSON.stringify( rawData ),
                'uber_user_id': uberSarReport.uber_user_id,
                'notes': uberSarReport.notes
            } );

            self.validate().then( function(){

                report.set( 'status', 1 );

                report.save().then(
                    function(){
                        self.set( 'isLocked', false );
                        self.notify.success( 'Suspicious Activity Report Sent', { closeAfter: 5000 } );

                        var route = self.container.lookup( 'route:uber-sar-reports.index' );
                        route.refresh();
                        self.transitionToRoute( 'uber-sar-reports.index' );
                    },
                    function( xhr ){
                        report.set( 'status', 0 );
                        if( xhr.status === 400 ){
                            var errors = JSON.parse( xhr.responseText ).errors;
                            var html = '<div style="text-align:center;"><h3>Could not send report</h3></div>' +
                                       '<p>The report could not be sent because the following validation errors were found:</p>' +
                                       '<ul style="max-height:250px; overflow:hidden; overflow-y:scroll; border:1px;">';
                            for( var i = 0; i < errors.length; i++ ){
                                html += '<li>' + errors[ i ].msg + '</li>';
                            }
                            html += '</ul>' +
                                    '<p>Please correct these ' + errors.length + ' issues above and then try to send the report again.</p>';
                            self.notify.error( { raw: html, closeAfter: null } );
                        }
                        else{
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil').handleError( xhr, {
                                scope: self
                            } );

                            self.set( 'isLocked', false );
                        }
                    }
                );
            } );
        },

        togglePanel: function( activityId ){
            var panelToggle = $( document ).find( "a[data-target='#activity-" + activityId + "']" );
            var panel = $( document ).find( "#activity-" + activityId );
            var target = panelToggle.next();
            if( !panel.hasClass( 'collapsing' ) ){
                if ( panel.hasClass( 'in' ) ) {
                    target.find( ".fa-chevron-up" ).replaceWith( '<i class="fa fa-chevron-down pull-right"></i>' );
                }
                else {
                    target.find( ".fa-chevron-down" ).replaceWith( '<i class="fa fa-chevron-up pull-right"></i>' );
                }
            }
            panelToggle.click();
        },

        addActivity: function(){
            this.get( 'uberSarReport.activities' ).pushObject( {
                subjects: Ember.A().unshiftObjects( this.get( 'uberSarReport.transactionSubjects' ) )
            } );
        },

        deleteActivity: function( activity ){
            this.get( 'uberSarReport.activities' ).removeObject( activity );
            this.get( 'uberSarReport' ).removeExtraSubjects();
        },

        lookupTransaction: function(){
            var self = this;
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/' + self.get( 'transaction_type' ) + '/search' + '?value=' + self.get( 'value' ),
                    type: 'get'
                } ).then( function( res ){
                        var activities = self.get( 'uberSarReport.activities' );
                        var transactions = self.get( 'uberSarReport.transactions' );
                        var transactionSubjects = self.get( 'uberSarReport.transactionSubjects' );
                        if( self.get( 'transaction_type' ) === "wires" ){
                            if( !Ember.isEmpty( res.wires ) ){
                                for( var i = 0; i < res.wires.length; i++ ){

                                    var client_role = "";
                                    var subject_role = "";
                                    var account_type = "";

                                    if( res.wires[ i ].type === 0 ){
                                        client_role = "A";
                                        subject_role = "B";
                                    }
                                    else if( res.wires[ i ].type === 1 ){
                                        client_role = "B";
                                        subject_role = "A";
                                    }

                                    if( res.wires[ i ].beneficiary_type === 0 ){
                                    	account_type = "personal";
                                    }
                                    else{
                                    	account_type = "business";
                                    }

                                    var transaction = {
                                        id: res.wires[ i ].id,
                                        name: 'W-' + res.wires[ i ].name,
                                        date: res.wires[ i ].created_at,
                                        amount: res.wires[ i ].amount,
                                        currency_id: res.wires[ i ].currency_id,
                                        type: 'Wire'
                                    };

                                    var personSubject = {
                                        date_of_birth: res.wires[ i ].account_holder_dob,
                                        address: res.wires[ i ].account_holder_address,
                                        city: res.wires[ i ].account_holder_city,
                                        postal_code: res.wires[ i ].account_holder_postal_code,
                                        state_province: res.wires[ i ].account_holder_state_province,
                                        country: res.wires[ i ].account_holder_country,
                                        nationality: res.wires[ i ].account_holder_nationality,
                                        subject_role: subject_role,
                                        account_type: account_type
                                    };
                                    
                                    switch( account_type ){
                                    case "business":
                                    	personSubject.name = res.wires[ i ].account_holder;
                                    	break;
                                    case "personal":
                                        personSubject.last_name = res.wires[ i ].account_holder;
                                        break;
                                    	default:
                                    }

                                    var companySubject = {
                                        company: { id: res.wires[ i ].company_id },
                                        subject_role: client_role
                                    };

                                    var existingCompanySubject = transactionSubjects.findBy( 'company.id', companySubject.company.id );

                                    if( transactions.indexOf( transaction ) < 0 ){
                                        transactions.pushObject( transaction );
                                    }
                                    transactionSubjects.unshiftObject( personSubject );
                                    for ( var ii = 0; ii < activities.length; ii++ ) {
                                        activities[ ii ].subjects.unshiftObject( personSubject );
                                    }
                                    if( !existingCompanySubject ){
                                        transactionSubjects.unshiftObject( companySubject );
                                        for ( var ii = 0; ii < activities.length; ii++ ) {
                                            if( !activities[ ii ].subjects.findBy( 'company.id', companySubject.company.id ) ) {
                                                activities[ ii ].subjects.unshiftObject( companySubject );
                                            }
                                        }
                                    }
                                    else {
                                        for ( var ii = 0; ii < activities.length; ii++ ) {
                                            if( activities[ ii ].subjects.indexOf( existingCompanySubject ) < 0 ) {
                                                activities[ ii ].subjects.unshiftObject( existingCompanySubject );
                                            }
                                        }
                                    }
                                }
                            }
                            else{
                                self.set( 'lookupError', 'No wire transactions with the id: "' + self.get( 'value' ) + '"' );
                                self.set( 'hasLookupError', true );
                                return;
                            }
                        }
                        else if( self.get( 'transaction_type' ) === 'fxRequests' ){
                            if( !Ember.isEmpty( res.fx_requests ) ){
                                for( var i = 0; i < res.fx_requests.length; i++ ){

                                    var transaction = {
                                        id: res.fx_requests[ i ].id,
                                        name: 'FX-' + res.fx_requests[ i ].name,
                                        date: res.fx_requests[ i ].created_at,
                                        base_amount: res.fx_requests[ i ].base_amount,
                                        counter_amount: res.fx_requests[ i ].counter_amount,
                                        base_currency_id: res.fx_requests[ i ].base_currency_id,
                                        counter_currency_id: res.fx_requests[ i ].counter_currency_id,
                                        type: 'FXRequest',
                                        involved_parties: [ {
                                            to: {
                                                company_id: res.fx_requests[ i ].company_id,
                                                index: subjects.length
                                            }
                                        }, {
                                            from: {
                                                company_id: res.fx_requests[ i ].company_id,
                                                index: subjects.length
                                            }
                                        } ]
                                    };

                                    var companySubject = {
                                        company: {
                                            id: res.fx_requests[ i ].company_id
                                        },
                                        subject_role: "C"
                                    };

                                    transactions.pushObject( transaction );
                                    transactionSubjects.pushObject( companySubject );
                                    for( var ii = 0; ii < activities.length; ii++ ) {
                                        activities[ ii ].subjects.unshiftObject( companySubject );
                                    }
                                }
                            }
                            else{
                                self.set( 'lookupError', 'No foreign exchange transactions with the id: "' + self.get( 'value' ) + '"' );
                                self.set( 'hasLookupError', true );
                                return;
                            }
                        }
                        self.set( 'value', null );
                        self.set( 'transaction_type', null );
                        self.set( 'lookupError', "" );
                        self.set( 'hasLookupError', false );
                        self.set( 'lookedUp', true );
                        self.set( 'defaulted', false );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        },

        changeTransaction: function(){
            var activities = this.get( 'uberSarReport.activities' );
            var transactionSubjects = this.get( 'uberSarReport.transactionSubjects' );
            for( var i = 0; i < activities.length; i++ ){
                activities[ i ].subjects.removeObjects( transactionSubjects );
            }
            this.set( 'uberSarReport.transactions', Ember.A() );
            this.set( 'uberSarReport.transactionSubjects', Ember.A() );
            this.set( 'lookedUp', false );
        },

        getPdf: function(){
            window.open( this.get( 'uberSarReport.url_pdf' ) + '?token=' + this.get( 'session.access_token' ), '_self' );
        },

        getFinCEN: function( fileType ){
            window.open( this.get( 'uberSarReport.url_fincen' ) + '?file_type=' + fileType + '&token=' + this.get( 'session.access_token' ), '_self' );
        },

        getgoAML: function( fileType ){
            window.open( this.get( 'uberSarReport.url_goAml' ) + '?token=' + this.get( 'session.access_token' ), '_self' );
        },
    }
} );
