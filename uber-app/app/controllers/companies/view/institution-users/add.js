import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        "user.last_name": {
            presence: true
        },
        "user.first_name": {
            presence: true
        },
        "user.email": {
            presence: true
        },
        "user.phone_mobile": {
            presence: true
        }
    },

    actions: {
        selectExistingUser: function( theUser, origin ){
            if( theUser !== null ){
                this.set( 'user.first_name', theUser.get( 'first_name' ) );
                this.set( 'user.last_name', theUser.get( 'last_name' ) );
                this.set( 'user.phone_mobile', theUser.get( 'phone_mobile' ) );
                this.set( 'user.email', theUser.get( 'email' ) );
            }
            else{
                this.set( 'user.first_name', null );
                this.set( 'user.last_name', null );
                this.set( 'user.phone_mobile', null );
                this.set( 'user.email', null );
            }
        },

        createInstitutionUser: function(){
            var self = this;
            this.validate().then( function(){
                self.set( 'isLocked', true );
                var newUser = self.store.createRecord( 'institution-user', {
                    first_name: self.get( 'user.first_name' ),
                    last_name: self.get( 'user.last_name' ),
                    company_id: self.get( 'company_id' ),
                    email: self.get( 'user.email' ),
                    phone_mobile: self.get( 'user.phone_mobile' )
                } );
                newUser.save().then(
                    function(){
                        self.set( 'isLocked', false );
                        var route = self.container.lookup( 'route:companies.view.institution-users' );
                        route.refresh();
                        self.transitionToRoute( 'companies.view.institution-users', self.get( 'company_id' ) );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                        self.set( 'isLocked', false );
                    }
                );
            } ).catch( function( err ){
                self.get( 'akxUtil' ).handleError( err, {
                    scope: self
                } );
            } );
        }
    }
} );