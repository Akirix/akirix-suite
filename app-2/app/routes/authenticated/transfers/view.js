import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, AuthenticatedRouteMixin, CloseMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            wire: this.store.findRecord( 'wire', params.wire_id ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'account' ] = model.wire.get( 'account' );
        model[ 'company' ] = model.wire.get( 'company' );
        return Ember.RSVP.hash( model );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let template;

        if( model.wire.get( 'type' ) === 0 ){
            template = 'transfers/view-withdrawal';
        }
        else if( model.wire.get( 'type' ) === 1 ){
            template = 'transfers/view-deposit';
        }
        else{
            let myID = this.get( 'session.data.authenticated.company.id' );
            template = 'transfers/view-book-transfer';
            model.wire.set( 'isMine', model.company.get( 'id' ) === myID );
        }
        this.send( 'openSidePanel', template, 'transfers/side-nav-view', controller );
    }
} );
