import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    validations: {
        'task.type': {
            presence: true
        },
        'task.title': {
            presence: true
        },
        'task.notes': {
            presence: true
        }
    },

    actions: {

        skipStep: function( route ){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'model' );
            return akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/updateStep', 'put', {
                route: route,
                status: 1
            } ).then( function( result ){
                _this.send( 'reloadRegistrationModel' );
                _this.notify.info( 'Updated' );
            }, function(){
                _this.notify.alert( '' );
            } );
        },

        revokeStep: function( route ){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'model' );
            return akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/updateStep', 'put', {
                route: route,
                status: 0
            } ).then( function( result ){
                _this.send( 'reloadRegistrationModel' );
                _this.notify.info( 'Updated' );
            }, function(){
                _this.notify.alert( '' );
            } );
        }
    }
} );

