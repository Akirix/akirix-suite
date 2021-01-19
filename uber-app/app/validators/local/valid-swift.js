import Base from 'ember-validations/validators/base';
import ibantools from 'npm:ibantools';
import _ from 'lodash/lodash';

export default Base.extend( {
    call: function(){
        if( !_.isEmpty( this.model.get( this.property ) ) && !ibantools.isValidBIC( this.model.get( this.property ) ) ){
            this.errors.pushObject( "Invalid SWIFT" );
        }
    }
} );