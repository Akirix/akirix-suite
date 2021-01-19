import Ember from 'ember';
import config from 'akx-app/config/environment';

export default Ember.Controller.extend( {
    session: Ember.inject.service(),
    queryParams: [ 'accountID' ],

    actions: {
        downloadTransactions(){
            let changeset = this.get( 'changeset' );
            let accountID = this.get( 'accountID' );
            let isoFormat = new Date( changeset.get( 'period_from' ) ).toISOString();
            let isoFormatTo = new Date( changeset.get( 'period_to' ) ).toISOString();

            let token = this.get( 'session.data.authenticated.access_token' );
            let url = `${config.APP.api_host}/accounts/${accountID}/download?token=${token}&file_type=${changeset.get( 'file_type' )}&period_from=${isoFormat}&period_to=${isoFormatTo}`;
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    window.open( url, '_self', false );
                    this.send( 'closeSidePanel' );
                }
            } );
        }
    }
} );
