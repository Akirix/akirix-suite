import Base from 'ember-validations/validators/base';
import config from 'uber-app/config/environment';

export default Base.extend( {

    call: function(){
        var password = this.model.get( this.property );
        var passReq = config.APP.password_requirements;

        if( !this.model.get( 'allowBadPassword' ) && password ){
            // Check length (custom for easy integration with other applications)
            if( password.length < passReq.passwordLength ){
                this.errors.pushObject( 'is too short (minimum is ' + passReq.passwordLength + ' characters)' );
            }
            //Check for numbers
            if( !password.match( /[0-9]/ ) || password.match( /[0-9]/g ).length < passReq.numbers ){
                this.errors.pushObject( 'Must contain at least ' + passReq.numbers + ' numbers' );
            }
            //Check for minimum lowercase
            if( !password.match( /[a-z]/ ) || password.match( /[a-z]/g ).length < passReq.lowercase ){
                this.errors.pushObject( 'Must contain at least ' + passReq.lowercase + ' lowercase' );
            }
            //Check for minimum uppercase
            if( !password.match( /[A-Z]/ ) || password.match( /[A-Z]/g ).length < passReq.uppercase ){
                this.errors.pushObject( 'Must contain at least ' + passReq.uppercase + ' uppercase' );
            }
            //Check for special characters
            if( !password.match( /[^A-Za-z0-9]/ ) || password.match( /[^A-Za-z0-9]/g ).length < passReq.symbols ){
                this.errors.pushObject( 'Must contain at least ' + passReq.symbols + ' special characters' );
            }
        }
    }
} );
