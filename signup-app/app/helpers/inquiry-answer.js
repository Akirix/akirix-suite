import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Handlebars.makeBoundHelper( function( answer ){
    var result = '';
    if( typeof answer === 'object' ){

        result += '<ul class="list-unstyled">';
        _.forEach( answer, function( value ){
            if( !Ember.isEmpty( value ) ){
                result += '<li>' + value + '</li>';
            }
        } );
        result += '</ul>';
    }
    else{
        if( !Ember.isEmpty( answer ) ){
            result = answer;
        }
    }

    return new Ember.Handlebars.SafeString( result );
} );

