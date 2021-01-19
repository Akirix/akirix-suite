import Ember from 'ember';
import lookupValidator from 'ember-changeset-validations';
import { validatePresence, validateLength, validateExclusion, validateConfirmation } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Component.extend( {
    classNames: [ 'overpane-content' ],
    notify: Ember.inject.service(),
    setUp: function(){
        let changesets = Ember.A();
        this.get( 'options.infoRequests' ).forEach( ( req )=>{
            if( req.get( 'isDocument' ) ){
                let c = new Changeset(
                    req,
                    lookupValidator( { documents: validateLength( { min: 1 } ) } ),
                    { documents: validateLength( { min: 1 } ) },
                    { skipValidate: true }
                );
                c.set( 'documents', Ember.A() );
                c.set( 'model', 'info-request' );
                c.set( 'model_id', req.id );
                c.set( 'isDocument', true );
                changesets.push( c );
            }
            else if( req.get( 'isTerms' ) ){
                let c = new Changeset(
                    req,
                    lookupValidator( {
                        termsResponse: [ validatePresence( true ), validateConfirmation( { on: 'userName' } ) ],
                        firstAgreement: validateExclusion( { list: [ false ] } ),
                        secondAgreement: validateExclusion( { list: [ false ] } )
                    } ),
                    {
                        termsResponse: validatePresence( true ),
                        firstAgreement: validateExclusion( { list: [ false ] } ),
                        secondAgreement: validateExclusion( { list: [ false ] } )
                    },
                    { skipValidate: true }
                );
                c.set( 'firstAgreement', false );
                c.set( 'secondAgreement', false );
                c.set( 'termsResponse', '' );
                c.set( 'userName', this.get( 'options.userName' ) );
                c.set( 'isTerms', true );
                changesets.push( c );
            }
            else {
                changesets.push( new Changeset(
                    req,
                    lookupValidator( { response: validatePresence( true ) } ),
                    { response: validatePresence( true ) },
                    { skipValidate: true }
                ) );
            }
        } );
        this.setProperties( {
            stringList: this.get( 'localeFile.info-requests' ),
            changesets: changesets,
            userName: this.get( 'options.userName' )
        } );
    }.on( 'init' ),

    actions: {
        addResponse( changeset ){
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                if( isValid ){
                    let changesets = this.get( 'changesets' );

                    this.get( 'notify' ).success( this.get( 'stringList.success' ), {
                        classNames: [ 'bg-success' ]
                    } );
                    changesets.removeObject( changeset );
                    if( Ember.isEmpty( changesets ) ){
                        this.sendAction( 'action', true );
                    }
                }
            } ).then( ()=>{
                this.set( 'isLocked', false );
            } ).catch( ( err )=>{
                this.get( 'notify' ).warning( err, {
                    classNames: [ 'bg-warning' ]
                } );
            } );
        },
        closeOverPane(){
            this.sendAction( 'action', true );
        }
    }
} );
