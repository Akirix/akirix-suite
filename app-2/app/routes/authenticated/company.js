import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    activate(){
        document.title = "Company Settings";
    },
    model(){
        let dataObj = this.get( 'session.data.authenticated' );
        return Ember.RSVP.hash( {
            company: this.store.findRecord( 'company', dataObj.company.id ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },
    setupController( controller, model ){
        this._super( ...arguments );

        controller.setProperties( {
            isLocked: false,
            success: false,
            changeset: new Changeset( model.company, lookupValidator( {} ), {} ),
            credentials: ''
        } );
    },

    renderTemplate(){
        this.render( 'company/view', {
            into: 'authenticated'
        } );
    }
} );
