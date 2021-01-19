import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( wire, company, wireComName, wireComAcctNum ){
    var outputString = '';
    if( wire.get( 'company_id' ) === company.get( 'id' ) ){
        outputString = '<span class="medium">' + wire.get( 'account_holder' ) + '</span><br/><span class="small">' +
            '<i class="fa fa-university fa-fw"></i> ' + wire.get( 'account_number' ) + '</span>';
    }
    else{
        outputString = '<span class="medium">' + wireComName + '</span><br/><span class="small">' +
            '<i class="fa fa-university fa-fw"></i> ' + wireComAcctNum + '</span>';
    }

    return new Ember.Handlebars.SafeString( outputString );
} );