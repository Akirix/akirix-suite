import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import projectValidations from 'akx-app/validations/projects';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, DirtyCheck, {
    activate(){
        Ember.$( window ).on( 'beforeunload', ()=>{
            return null;
        } );
    },
    model(){
        return Ember.RSVP.hash( {
            project: this.store.createRecord( 'project' ),
            accounts: this.store.findAll( 'account', { type: 0 } )
        } );
    },
    setupController( controller, model ){
        this._super( ...arguments );
        projectValidations.discount_rate.push(
            function( _, newValue, oldValue, changes ){
                if( changes.fixed_profit_margin ){
                    return changes.type === 2 && Ember.isEmpty( newValue ) ? controller.get( 'stringList.discountRateErrorMessage' ) : true
                }
                return true;
            }
        );

        projectValidations.invoice_deadline.push(
            function( _, newValue, oldValue, changes ){
                return changes.type === 2 && Ember.isEmpty( newValue ) ? controller.get( 'stringList.invoiceDeadlineErrorMessage' ) : true
            }
        );

        let c = {
            type: '',
            account_id: '',
            currency_id: '',
            contract_type: '',
            akx_agreement: '',
            akx_terms: '',
            fixed_profit_margin: 0,
            company_id: this.get( 'session.data.authenticated.company.id' ),
            name: ''
        };
        let changeset = new Changeset(
            c,
            lookupValidator( projectValidations ),
            projectValidations,
            { skipValidate: true }
        );
        model.project.set( 'node', '' );
        controller.setProperties( {
            changeset: changeset,
            nodeItems: Ember.A(),
            isLocked: false
        } );
        this.send( 'openSidePanel', 'projects/project-details', '', controller, true );
    },

    actions: {
        willTransition(){
            let controller = this.controllerFor( this.routeName );
            if( controller.get( 'changeset.isDirty' ) ){
                controller.send( 'deleteModel' );
            }
            return true;
        }
    }
} );
