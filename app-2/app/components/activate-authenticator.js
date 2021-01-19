import Ember from 'ember';
import lookupValidator from 'ember-changeset-validations';
import { validatePresence } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';
import config from 'akx-app/config/environment';

export default Ember.Component.extend( {
    classNames: [ 'overpane-content' ],
    session: Ember.inject.service(),

    setUp: function(){
        let session = this.get( 'session.data.authenticated' );
        let company = session.company;
        let authenticator = this.get( 'options.authenticator' );
        let string = `${config.APP.api_host}/authenticators/qr?key=${authenticator.get('key')}&acctNum=`;
        this.setProperties( {
            stringList: this.get( 'localeFile.activate-authenticator' ),
            authenticator: authenticator,
            isLocked: false,
            imgSrc: `${string}${company.account_number}&company_name=${company.name}&token=${session.access_token}`,
            changeset: new Changeset(
                { code: '' },
                lookupValidator( { code: validatePresence( true ) } ),
                { code: validatePresence( true ) }
            )
        } );
    }.on( 'init' ),

    actions: {
        activate(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'post',
                        data: JSON.stringify( { data: { code: changeset.get( 'code' )} } )
                    }, `/authenticators/${this.get( 'authenticator.id' )}/activate` );
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.get( 'authenticator' ).reload();
                    this.sendAction( 'action' );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.sendAction( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        closeOverPane(){
            this.sendAction( 'action' );
        }
    }
} );
