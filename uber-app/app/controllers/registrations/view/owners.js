import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',
    userBinding: 'controllers.registrations/view.model.user',
    companyBinding: 'controllers.registrations/view.model.company',
    ownersBinding: 'controllers.registrations/view.model.owners',
    executivesBinding: 'controllers.registrations/view.model.executives',
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
            //this.set( 'owners', [] );
            this.set( 'executives', [] );
            if( this.get( 'uboCount' ) !== 0 ){
                var initialCount = this.get( 'owners.length' );
                if( this.get( 'uboCount' ) > this.get( 'owners.length' ) ){

                }
                for( var i = initialCount; i < this.get( 'uboCount' ); i++ ){
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

        save: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );

            _this.set( 'isLocked', true );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id, 'put', { registration: registration } ).then( function( result ){
                _this.set( 'isLocked', false );
                _this.notify.info( 'Updated' );
            }, function(){
                _this.set( 'isLocked', false );
                _this.notify.alert( '' );
            } );
        },

        skipStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'skipStep', route );
        },

        revokeStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'revokeStep', route );
        }
    }
} );
