var Handlebars = require( 'handlebars' );
var config = require( '../config/config.json' );
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

module.exports = function(){
    Handlebars.registerHelper( 'compiled', function( content ){
        var template = Handlebars.compile( content.hash.content );
        var compiledTemplate = template( content.data.root );
        return new Handlebars.SafeString( compiledTemplate );
    } );

    Handlebars.registerHelper( 'server', function(){
        return config.host;
    } );

    Handlebars.registerHelper( 'date', function( content ){
        var date;
        var format = 'YYYY-MM-DD';

        if( !_.isEmpty( content.hash.date ) ){
            date = moment( content.hash.date );
        }
        else{
            date = moment();
        }

        if( _.isString( content.hash.format ) ){
            format = content.hash.format;
        }

        return date.format( format );
    } );

    Handlebars.registerHelper( 'number', function( content, options ){
        if( typeof content !== 'undefined' ){
            var numberValue = Number( content.toString().replace( /,/g, '' ) );
            if( !isNaN( numberValue ) ){
                return numberValue.toString().replace( /\B(?=(\d{3})+(?!\d))/g, "," );
            }
        }
    } );

    Handlebars.registerHelper( 'address-combiner', function( content, options ){
        var result = '';

        if( !_.isEmpty( content.hash.address ) ){
            result += content.hash.address + '<br>';
        }

        if( !_.isEmpty( content.hash.city ) ){
            result += content.hash.city + ' ';
        }

        if( !_.isEmpty( content.hash.state ) ){
            result += content.hash.state + ', ';
        }

        if( !_.isEmpty( content.hash.postal_code ) ){
            result += content.hash.postal_code + ' ';
        }

        if( !_.isEmpty( content.hash.country ) ){
            result += content.hash.country;
        }

        return new Handlebars.SafeString( result );
    } );

    Handlebars.registerHelper( 'status', function( content ){
        var result = '';
        switch( content.hash.status ){
            case 2:
                result += 'COMPLETE';
                break;
            case 3:
                result += 'CANCELLED';
                break;
            case 5:
                result += 'REJECTED';
                break;
            default:
                result += 'N/A';
        }
        return new Handlebars.SafeString( result );
    } );

    Handlebars.registerHelper( 'not-empty', function( content, options ){
        var result = 'N/A';

        if( !_.isEmpty( content ) ){
            result = content;
        }

        return new Handlebars.SafeString( result );
    } );

    Handlebars.registerHelper( 'is-value', function( content, options ){
        if( !_.isEmpty( content.hash.value ) && content.hash.test === content.hash.value ){
            return content.fn();
        }
        else{
            return new Handlebars.SafeString( 'N/A' );

        }
    } );
};