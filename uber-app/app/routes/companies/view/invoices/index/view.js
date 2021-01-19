
import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'invoice', params.invoice_id );
    },

    setupController: function( controller, model ){
        var self = this;

        if( model.get( 'type' ) === 0 ){
            this.store.find( 'node', model.get( 'node_id' ) ).then( function( node ){
                self.store.find( 'node', node.get( 'parent_id' ) ).then( function( bnode ){
                    self.store.find( 'document', { 'model': 'invoice', 'model_id': model.id } ).then( function( documents ){
                        controller.set( 'documents', documents );
                    } );
                    controller.set( 'node', node );
                    controller.set( 'bnode', bnode );
                    if( model.get( 'company_id' ) === self.get( 'session.company.id' ) ){
                        model.set( 'isMine', true );
                        controller.set( 'invoice_transactions', self.store.find( 'transaction', { model: 'invoice', model_id: model.id, account_id: node.get( 'account_id' ) } ) );
                    }
                    else{
                        model.set( 'isMine', false );
                        controller.set( 'invoice_transactions', self.store.find( 'transaction', { model: 'invoice', model_id: model.id, account_id: bnode.get( 'account_id' ) } ) );

                    }
                } );
            } );
        }
        else if( model.get( 'type' ) === 1 ){
            self.store.find( 'document', { 'model': 'invoice', 'model_id': model.id } ).then( function( documents ){
                controller.set( 'documents', documents );
            } );

            self.store.find( 'company', model.get( 'to_company_id' ) ).then( function( customer ){
                controller.set( 'customer', customer );
            } );

            if( model.get( 'company_id' ) === self.get( 'session.company.id' ) ){
                model.set( 'isMine', true );
                controller.set( 'invoice_transactions', self.store.find( 'transaction', { model: 'invoice', model_id: model.id } ) );
            }
            else{
                model.set( 'isMine', false );
                controller.set( 'invoice_transactions', self.store.find( 'transaction', { model: 'invoice', model_id: model.id } ) );
            }
        }
        else if( model.get( 'type' ) === 2 ){
            self.store.find( 'document', { 'model': 'invoice', 'model_id': model.id } ).then( function( documents ){
                controller.set( 'documents', documents );
            } );

            if( model.get( 'company_id' ) === self.get( 'session.company.id' ) ){
                model.set( 'isMine', true );
                controller.set( 'invoice_transactions', [] );
            }
            else{
                model.set( 'isMine', false );
                controller.set( 'invoice_transactions', [] );
            }
        }
        controller.set( 'invoice', model );

    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/invoices/view-invoice', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    actions: {
        goBack: function(){
            this.transitionTo( 'companies.view.invoices.index' )
        }
    }

} );

