import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( wire, symbol, company, isDebitColumn ){
    var outputString = '';
    switch( wire.get( 'type' ) ){
        case 0:
            if( isDebitColumn ){
                outputString = '<span class="text-rose">-</span> ' + symbol + wire.get( 'str_amount' );
            }
            break;
        case 1:
            if( !isDebitColumn ){
                outputString = '<span class="text-green">+</span> ' + symbol + wire.get( 'str_amount' );
            }
            break;
        case 2:
            if( isDebitColumn && wire.get( 'company_id' ) === company.get( 'id' ) ){
                outputString = '<span class="text-rose">-</span> ' + symbol + wire.get( 'str_amount' );
            }
            else if( !isDebitColumn && wire.get( 'account_number' ) === 'XYZ' + company.get( 'account_number' ) ){
                outputString = '<span class="text-green">+</span> ' + symbol + wire.get( 'str_amount' );
            }
            break;
        default:
            break;
    }
    return new Ember.Handlebars.SafeString( outputString );
} );
