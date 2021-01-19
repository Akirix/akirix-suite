import Ember from 'ember';
import config from 'signup-app/config/environment';
import defaultVerificationController from 'signup-app/controllers/verification/default';

export default defaultVerificationController.extend( {
    documentTypeName: 'primary_id',
    userBinding: 'controllers.application.content.user',

    stepComplete: function(){
        return this._stepComplete();
    }.property( 'documents', 'isValid', 'hasExemption' ),

    idWatcher: function(){
        // If noPassport changes
        if( this.get( 'noPassport' ) === false ){
            this.set( 'user.id_type', 'PID' );
        }
        else{
            this.set( 'idType', null );
            this.set( 'user.id_num', null );
        }
    }.observes( 'noPassport' ),

    init: function(){
        this._super();

        var noPassport = this.get( 'noPassport' );
        var userIdType = this.get( 'user.id_type' );

        if( Ember.isEmpty( userIdType ) ){
            this.set( 'user.id_type', 'PID' );
        }
        else if( userIdType !== 'PID' ){
            this.set( 'noPassport', true );
        }

        this.set( 'idType', this.get( 'user.id_type' ) );
        Ember.Binding.oneWay().from( 'idType' ).to( 'user.id_type' ).connect( this );
    },

    _stepComplete: function(){
        return this.get( 'documents' ).length > 0 && this.get( 'isValid' ) || this.get( 'hasExemption' );
    },

    actions: {
        nextStep: function(){
            Ember.Logger.log( 'primary-id nextStep' );
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = _this.get( 'registration' );
            var verificationController = this.get( 'controllers.verification' );

            if( _this.get( 'stepComplete' ) ){
                adapter.sendRequest( '/registrations/' + registration._id, 'put', { registration: registration } )
                    .then( function( result ){
                        verificationController.send( 'nextStep' );
                    } )
                    .catch( function(){
                        _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } );
            }
            else {
                Ember.Logger.log( 'Step not complete' );
            }
        }
    }
} );