import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    model( params ){
        return Ember.RSVP.hash( {
            project: this.modelFor( 'authenticated.projects.view').project,
            invoices: this.store.query( 'invoice', { node_id: params.node_id } ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
            nodeId: params.node_id
        } );
    },
    afterModel( model ){
        this._super( ...arguments );
        return model.project.get( 'node' );
    },
    setupController( controller, model ){
        this._super( ...arguments );
        let partialInvoices = Ember.A();
        let pendingInvoices = Ember.A();
        let paidInvoices = Ember.A();
        let draftInvoices = Ember.A();

        model.invoices.forEach( ( inv )=>{
            if( inv.get( 'isPartiallyPaid' ) ){
                partialInvoices.pushObject( inv );
            }
            else if( inv.get( 'isPaidFull' ) ){
                paidInvoices.pushObject( inv );
            }
            else if( inv.get( 'isPending' ) ){
                pendingInvoices.pushObject( inv );
            }
            else{
                draftInvoices.pushObject( inv );
            }
        } );
        controller.setProperties( {
            draftInvoices: draftInvoices,
            partialInvoices: partialInvoices,
            pendingInvoices: pendingInvoices,
            paidInvoices: paidInvoices,
            isMine: model.project.get( 'node.id' ) === model.nodeId
        } );
    },

    renderTemplate( controller ){
        this.send( 'openSidePanel', 'projects/view/invoices', '', controller, true );
    },

    actions: {
        willTransition( transition ){
            if( transition.targetName === `${this.get('routeName')}.index` ){
                this.refresh();
            }
        }
    }
} );
