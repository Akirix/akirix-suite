import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        var akxUtil = this.get( 'akxUtil' );
        var registration = this.modelFor( 'registrations/view' );

        return Ember.RSVP.hash( {
            verifications: akxUtil._sendRequest( '/signupVerifications?user_id=' + registration.user_id, 'get' ).then( function( result ){
                return result.data.verifications;
            } ),
            documentTypes: akxUtil._sendRequest( '/signupDocumentTypes', 'get' ).then( function( result ){
                return result.data.documentTypes;
            } )
        } );
    },
    afterModel: function( model, transition ){
        if( !Ember.isEmpty( model.verifications ) ){
            var emailVerifications = [];
            var smsVerifications = [];

            model.verifications.forEach( function( item ){
                if( item.status === 0 ){
                    Ember.set( item, 'complete', false );
                }
                else{
                    Ember.set( item, 'complete', true );
                }

                if( item.type === 0 ){
                    emailVerifications.push( item );
                }
                else if( item.type === 1 ){
                    smsVerifications.push( item );
                }
            } );

            Ember.set( model, 'emailVerifications', emailVerifications );
            Ember.set( model, 'smsVerifications', smsVerifications );
        }
        else{
            Ember.set( model, 'emailVerifications', [] );
            Ember.set( model, 'smsVerifications', [] );
        }
    },
    setupController: function( controller, model ){
        this._super( controller, model );
        controller.set( 'isLocked', false );
    },
    renderTemplate: function( controller, model ){
        this.render( 'registrations.agreement', {
            into: 'registrations.view',
            outlet: 'registrationPrimary'
        } );
    }
} );

