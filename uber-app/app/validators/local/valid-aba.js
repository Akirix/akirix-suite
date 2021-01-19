import Base from 'ember-validations/validators/base';
import brnv from 'npm:bank-routing-number-validator';
import _ from 'lodash/lodash';

export default Base.extend( {
    call: function(){
        if( !_.isEmpty( this.model.get( this.property ) ) && ( ( this.model.get( this.property ).length !== 9 ) || !brnv.ABARoutingNumberIsValid( this.model.get( this.property ) ) ) ){
            this.errors.pushObject( "Invalid ABA/Routing number" );
        }

    }
} );