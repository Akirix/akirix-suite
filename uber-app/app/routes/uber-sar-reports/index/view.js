import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-sar-report', params.uber_sar_report_id );
    },

    setupController: function( controller, model ){
        this._super( ...arguments );

        var activities = Ember.A();

        var rawData = JSON.parse( model.get( 'raw_data' ) );

        rawData.activities.forEach( function( activity ){
            var subjects = Ember.A();
            activity.subjects.forEach( function( subject ){
                subjects.pushObject( rawData[ subject.array ][ subject.index ] );
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

        var uberSarReport = {
            id: model.get( 'id' ),
            uber_user_id: model.get( 'uber_user_id' ),
            transactions: rawData.transactions,
            transactionSubjects: rawData.transactionSubjects,
            addedSubjects: rawData.addedSubjects,
            activities: activities,
            notes: model.get( 'notes' ),
            uberUser: model.get( 'uberUser' ),
            str_created_at: model.get( 'str_created_at' ),
            str_updated_at: model.get( 'str_updated_at' ),
            url_pdf: model.get( 'url_pdf' ),
            url_fincen: model.get( 'url_fincen' ),
            url_goAml:  model.get( 'url_goAml' )
        };

        uberSarReport.findArrayAndIndex = function( subject ){
            var array = "transactionSubjects";
            var index = this.transactionSubjects.indexOf( subject );
            if( index < 0 ){
                array = "addedSubjects";
                index = this.addedSubjects.indexOf( subject );
            }
            return {
                array: array,
                index: index
            }
        };

        uberSarReport.removeExtraSubjects = function(){
            var subjectsBeingUsed = Ember.A();
            this.activities.forEach( function( activity ){
                activity.subjects.forEach( function( subject ){
                    if( subjectsBeingUsed.indexOf( subject ) < 0 ){
                        subjectsBeingUsed.pushObject( subject );
                    }
                } );
            } );
            var addedSubjects = this.addedSubjects;
            var extraSubjects = addedSubjects.reject( function( subject ) {
                return subjectsBeingUsed.contains( subject );
            } );
            addedSubjects.removeObjects( extraSubjects );
        };

        var lookedUp = false;
        if( !Ember.isEmpty( rawData.transactions ) ){
            lookedUp = true;
        }

        controller.set( 'uberSarReport', uberSarReport );
        controller.set( 'readyToLookup', false );
        controller.set( 'lookedUp', lookedUp );
        controller.set( 'hasLookupError', false );
        controller.set( 'lookupError', "" );
        controller.set( 'transaction_type', "" );
        controller.set( 'value', "" );
    },

    renderTemplate: function( controller, model ){
        var templatePath;
        switch( model.get( 'status' ) ){
            case 0:
                templatePath =  'uber-sar-reports/new';
                break;
            case 1:
                templatePath =  'uber-sar-reports/sent';
                break;
            default:
        }

        this.render(templatePath, {
            into: 'uber-sar-reports',
            outlet: 'paneSecondary'
        } );
    }
} );
