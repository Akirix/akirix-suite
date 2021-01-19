import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import newAccountValidations from 'akx-app/validations/new-account';

export default Ember.Route.extend( StringObjectMixin, DirtyCheck, {
    model(){
        return Ember.RSVP.hash( {
            newAccount: {
                currency_type: '',
                purpose: '',
                volume_in: '',
                volume_in_frequency: '',
                volume_out: '',
                volume_out_frequency: '',
                average_balance: ''
            },
            currencies: this.store.findAll( 'currency' )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let currencyErrorMessage = controller.get( 'stringList.currencyErrorMessage')

        newAccountValidations.currency_type.push( ( _, newValue )=>{
            return !Ember.isEmpty( model.currencies.findBy( 'id', newValue ) ) ? true : currencyErrorMessage;
        } );

        let changeset = new Changeset(
            model.newAccount,
            lookupValidator( newAccountValidations ),
            newAccountValidations,
            { skipValidate: true }
        );

        controller.setProperties( {
            success: false,
            changeset: changeset
        } );

        this.send( 'openSidePanel', 'accounts/add-account', '', controller );
    },

    checkDirtyState( controller, closeSidePanel ){
        let changeset = controller.get( 'changeset' );
        if( changeset.get( 'isDirty' ) ){
            let response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
            if( response ){
                changeset.rollback();
                if( !closeSidePanel ){
                    this.send( 'closeSidePanel' );
                }
            }
            return response;
        }
        return true;
    },

    actions: {
        willTransition( transition ){
            let controller = this.controllerFor( this.routeName );
            if( this.checkDirtyState( controller ) ){
                return true;
            }
            transition.abort();
        },

        closeSidePanel(){
            let controller = this.controllerFor( this.routeName );
            let res = this.checkDirtyState( controller, true );
            if( res ){
                Ember.run.later( ()=>{
                    Ember.getOwner( this ).lookup( 'route:authenticated.accounts' ).refresh();
                }, 1000 );
            }
            return res;
        }
    }
} );
