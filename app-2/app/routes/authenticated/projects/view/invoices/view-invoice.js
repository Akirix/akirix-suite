import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            invoice: this.store.findRecord( 'invoice', params.invoice_id ),
            invoice_items: this.store.query( 'invoice-item', { invoice_id: params.invoice_id } ),
            project: this.modelFor( 'authenticated.projects.view').project,
            transactions: this.store.query( 'transaction', { model: 'invoice', 'model_id': params.invoice_id } ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },
    afterModel( model ){
        this._super( ...arguments );
        model[ 'toCompany' ] = model.invoice.get( 'toCompany' );
        model[ 'fromCompany' ] = model.invoice.get( 'company' );
        model[ 'node' ] = model.invoice.get( 'node' );
        return Ember.RSVP.hash( model );
    },
    setupController( controller, model ){
        this._super( ...arguments );
        let companyID = this.get( 'session.data.authenticated.company.id' );
        model.invoice.set( 'isMine', companyID === model.invoice.get( 'company_id' ) );
        this.send(
            'openSidePanel',
            'projects/view/view-invoice',
            'projects/view/side-navs/invoice-view',
            controller,
            true
        );
    },

    actions: {
        willTransition( transition ){
            if( transition.targetName === `${this.get('routeName')}.index` ){
                this.refresh();
            }
            return true;
        }
    }
} );
