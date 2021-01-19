import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    templateName: 'companies/accounts/view-transaction',
    model: function( params ){
        var company_id = this.modelFor( 'companies.view' ).get( 'id' );
        var self = this;
        var store = this.store;
        var result = {};

        return store.find( 'transaction', params.transaction_id )
            .then( function( transaction ){
                result[ 'transaction' ] = transaction;
                var model = transaction.get( 'model' );
                var model_id = transaction.get( 'model_id' );
                if( !Ember.isEmpty( model ) && !Ember.isEmpty( model_id ) ){
                    return self.store.find( model, model_id );
                }
                else{
                    return null;
                }
            } )
            .then( function( transactionModel ){
                switch( result[ 'transaction' ].get( 'type' ) ){
                    case 3:
                        if( result.transaction.get( 'model' ) === 'charge' ){
                            result[ 'charge' ] = transactionModel;
                        }
                        self.set( 'templateName', 'companies/accounts/view-fee' );
                        return result;
                    case 5:
                        self.set( 'templateName', 'companies/accounts/view-account-transfer' );
                        return result;
                    default:
                        if( !Ember.isEmpty( transactionModel ) ){
                            switch( result.transaction.get( 'model' ) ){
                                case 'node':
                                    self.set( 'templateName', 'companies/accounts/view-project' );

                                    return store.find( 'project', transactionModel.get( 'project_id' ) )
                                        .then( function( project ){
                                            result[ 'project' ] = project;
                                        } );
                                case 'fund':
                                    if( transactionModel.get( 'investor_id' ) === company_id ){
                                        transactionModel.set( 'isInvestor', true );
                                    }
                                    else{
                                        transactionModel.set( 'isInvestor', false );
                                    }

                                    result[ 'fund' ] = transactionModel;
                                    self.set( 'templateName', 'companies/accounts/view-fund' );
                                    break;
                                case 'invoice':
                                    var promises = [];
                                    var invoiceType = transactionModel.get( 'type' );

                                    // Documents
                                    var documentsPromise = self.store.find( 'document', {
                                        model: 'invoice',
                                        model_id: transactionModel.get( 'id' )
                                    } ).then( function( documents ){
                                        result[ 'documents' ] = documents;
                                    } );
                                    promises.push( documentsPromise );

                                    // Project Invoice
                                    if( invoiceType === 0 ){

                                        // Nodes
                                        var nodePromise = store.find( 'node', transactionModel.get( 'node_id' ) )
                                            .then( function( node ){
                                                result[ 'node' ] = node;

                                                // Find bnode
                                                return store.find( 'node', node.get( 'parent_id' ) );
                                            } )
                                            .then( function( bnode ){
                                                result[ 'bnode' ] = bnode;
                                                var node = result[ 'node' ];

                                                if( !Ember.isEmpty( node.get( 'fund_id' ) ) ){
                                                    return node.get( 'fund' )
                                                        .then( function( fund ){
                                                            result[ 'fund' ] = fund;
                                                        } );
                                                }
                                            } )
                                            .then( function(){
                                                var node = result[ 'node' ];
                                                var bnode = result[ 'bnode' ];
                                                var invoiceTransactionsNode;

                                                if( transactionModel.get( 'company_id' ) === company_id ){
                                                    transactionModel.set( 'isMine', true );
                                                    invoiceTransactionsNode = node;
                                                }
                                                else{
                                                    transactionModel.set( 'isMine', false );
                                                    invoiceTransactionsNode = bnode;
                                                }

                                                return self.store.find( 'transaction', {
                                                    model: 'invoice',
                                                    model_id: transactionModel.id,
                                                    account_id: invoiceTransactionsNode.get( 'account_id' )
                                                } )
                                                    .then( function( invoice_transactions ){
                                                        result[ 'invoice_transactions' ] = invoice_transactions;
                                                    } );
                                            } );

                                        promises.push( nodePromise );

                                    }
                                    // One time on platform
                                    else if( invoiceType === 1 ){
                                        var companyPromise = self.store.find( 'company', transactionModel.get( 'to_company_id' ) )
                                            .then( function( customer ){
                                                result[ 'customer' ] = customer;
                                            } );
                                        promises.push( companyPromise );

                                        var invoiceTransactionsPromise = self.store.find( 'transaction', {
                                            model: 'invoice',
                                            model_id: transactionModel.id
                                        } )
                                            .then( function( invoice_transactions ){
                                                result[ 'invoice_transactions' ] = invoice_transactions;
                                            } );
                                        promises.push( invoiceTransactionsPromise );

                                        transactionModel.set( 'isMine', transactionModel.get( 'company_id' ) === company_id );
                                    }
                                    // One time off platform
                                    else{
                                        if( transactionModel.get( 'company_id' ) === company_id ){
                                            transactionModel.set( 'isMine', true );
                                            self.set( 'invoice_transactions', [] );
                                        }
                                        else{
                                            transactionModel.set( 'isMine', false );
                                            self.set( 'invoice_transactions', [] );
                                        }
                                    }

                                    self.set( 'templateName', 'companies/accounts/view-invoice' );

                                    result[ 'invoice' ] = transactionModel;

                                    return Ember.RSVP.all( promises );
                                case 'wire':
                                    result[ 'wire' ] = transactionModel;

                                    switch( transactionModel.get( 'type' ) ){
                                        case 0:
                                            self.set( 'templateName', 'companies/accounts/view-withdrawal' );
                                            break;
                                        case 1:
                                            self.set( 'templateName', 'companies/accounts/view-deposit' );
                                            break;
                                        case 2:
                                            self.set( 'templateName', 'companies/accounts/view-book-transfer' );

                                            if( transactionModel.get( 'company_id' ) === company_id ){
                                                transactionModel.set( 'isMine', true );
                                            }
                                            else{
                                                transactionModel.set( 'isMine', false );

                                                return self.store.find( 'account', result[ 'transaction' ].get( 'to_account_id' ) )
                                                    .then( function( account ){
                                                        transactionModel.set( 'toAccount', account );
                                                    } );
                                            }
                                            break;
                                        default:
                                    }
                                    break;
                                case 'commission-payment':
                                    result[ 'commission-payment' ] = transactionModel;
                                    self.set( 'templateName', 'companies/accounts/view-commission-payment' );
                                    return self.store.find( 'commission-payment-item', { commission_payment_id: transactionModel.id } ).then( function( cpis ){
                                        result[ 'commissionPaymentItems' ] = cpis;
                                    } );
                                case 'fx-request':
                                    result[ 'fxRequest' ] = transactionModel;
                                    self.set( 'templateName', 'companies/accounts/view-fx' );
                                    break;
                            }
                        }
                }
            } )
            .then( function(){
                return Ember.RSVP.Promise.resolve( result );
            } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'account_id', this.modelFor( 'companies.view.accounts.view' ).get( 'id' ) );
    },

    renderTemplate: function( controller, model ){
        var templateName = this.get( 'templateName' );

        this.render( templateName, {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );

