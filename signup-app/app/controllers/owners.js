import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    registrationBinding: 'controllers.application.model',
    companyBinding: 'controllers.application.model.company',
    ownersBinding: 'controllers.application.model.owners',
    executivesBinding: 'controllers.application.model.executives',
    uboCount: null,

    uboCountOptions: [
        { name: '0', val: 0 },
        { name: '1', val: 1 },
        { name: '2', val: 2 },
        { name: '3', val: 3 },
        { name: '4', val: 4 }
    ],

    answeredUBO: function(){
        return !Ember.isEmpty( this.get( 'uboCount' ) );
    }.property( 'uboCount' ),

    hasUBO: function(){
        var uboCount = this.get( 'uboCount' );
        return !Ember.isEmpty( uboCount ) && uboCount > 0;
    }.property( 'uboCount' ),

    hasExecutive: function(){
        var uboCount = this.get( 'uboCount' );
        return !Ember.isEmpty( uboCount ) && uboCount === 0;
    }.property( 'uboCount' ),

    uboCountUpdated: function(){
        if( this.get( 'uboCount' ) !== null ){
            this.set( 'owners', [] );
            this.set( 'executives', [] );
            if( this.get( 'uboCount' ) !== 0 ){
                for( var i = 0; i < this.get( 'uboCount' ); i++ ){
                    this.get( 'owners' ).pushObject( {
                        name: null,
                        date_of_birth: null,
                        nationality: null,
                        address: null,
                        city: null,
                        state_province: null,
                        country: null,
                        id_country: null,
                        id_type: null,
                        id_num: null,
                        percent_ownership: null
                    } );
                }
                var registration = this.get( 'registration' );
                var user = this.get( 'registration.user' );
                if( user.is_owner ){
                    this.get( 'owners' )[ 0 ] = {
                        name: user.first_name + ' ' + user.last_name,
                        date_of_birth: user.date_of_birth,
                        nationality: user.nationality,
                        address: null,
                        city: null,
                        state_province: null,
                        country: null,
                        id_country: user.id_country,
                        id_type: user.id_type,
                        id_num: user.id_num,
                        percent_ownership: registration.get( 'isPersonal' ) ? 100 : null
                    };
                }
            }

            else{
                this.get( 'executives' ).pushObject( {
                    name: null,
                    date_of_birth: null,
                    nationality: null,
                    phone: null,
                    id_country: null,
                    id_type: null,
                    id_num: null
                } );
            }
        }
    }.observes( 'uboCount' ),

    submitted: false,

    actions: {
        addMember: function(){
            this.get( 'executives' ).pushObject( {
                name: null,
                date_of_birth: null,
                nationality: null,
                phone: null,
                id_country: null,
                id_type: null,
                id_num: null
            } );
        },

        submit: function(){
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = _this.get( 'registration' );

            _this.validate().then( function(){
                if( _this.get( 'ubo' ) === 0 ){
                    registration.set( 'owners', [] );
                }
                var hasError = false;
                registration.get( 'owners' ).forEach( function( owner ){
                    if( owner.hasError ){
                        hasError = true;
                    }
                    else{
                        delete owner.hasError;
                    }
                } );
                registration.get( 'executives' ).forEach( function( executive ){
                    if( executive.hasError ){
                        hasError = true;
                    }
                    else{
                        delete executive.hasError;
                    }
                } );

                if( !hasError ){
                    return adapter.sendRequest( '/registrations/' + registration._id, 'put', { registration: registration } )
                        .then( function( result ){
                            registration.completeStep( 'owners' );
                            return adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } );
                        } )
                        .then( function( result ){
                            _this.set( 'validated', false );
                            _this.transitionToRoute( registration.get( 'nextStep' ) );
                        } )
                        .catch( function(){
                            _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                        } );
                }
            }, function(){
            } ).finally( function(){
                _this.set( 'formLocked', false );
            } );
        }
    }
} );
