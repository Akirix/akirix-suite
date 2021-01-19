import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    setupController: function( controller ){
        controller.store.find( 'uber-user' ).then( function( uberUsers ){
            controller.set( 'uberUsers', uberUsers );
        } );

        var activities = Ember.A();

        activities.pushObject( {
            subjects: Ember.A()
        } );

        var uberSarReport = {
            uber_user_id: this.get( 'session.user.id' ),
            transactions: Ember.A(),
            transactionSubjects: Ember.A(),
            addedSubjects: Ember.A(),
            activities: activities,
            notes: null
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

        controller.set( 'uberSarReport', uberSarReport );
        controller.set( 'defaulted', false );
        controller.set( 'readyToLookup', false );
        controller.set( 'lookedUp', false );
        controller.set( 'hasLookupError', false );
        controller.set( 'lookupError', "" );
        controller.set( 'transaction_type', "" );
        controller.set( 'value', "" );
    },

    renderTemplate: function( controller, model ){
        this.render( 'uber-sar-reports/add', {
            into: 'uber-sar-reports',
            outlet: 'paneSecondary'
        } );
    }
} );
