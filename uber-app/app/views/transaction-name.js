import Ember from 'ember';

export default Ember.View.extend( {
    templateName: 'views/transaction-name',
    model: null,
    model_id: null,
    title: null,
    description: null,

    init: function(){
        var self = this;
        var store = this.get( 'controller' ).get( 'store' );
        var model = this.get( 'model' );
        var model_id = this.get( 'model_id' );
        switch( this.get( 'type' ) ){
            case 3:
                if( model === 'charge' ){
                    store.find( model, model_id ).then( function( charge ){
                        self.set( 'title', charge.get( 'title' ) );
                        self.set( 'description', charge.get( 'notes' ).substring( 0, 35 ) );
                    } );
                }
                else{
                    self.set( 'title', 'Fee' );
                    self.set( 'description', '' );
                }
                break;
            case 5:
                self.set( 'title', 'Account Transfer' );
                self.set( 'description', '' );
                break;
            default:
                if( !Ember.isEmpty( model ) && !Ember.isEmpty( model_id ) ){
                    store.find( model, model_id ).then( function( item ){
                        switch( model ){
                            case 'node':
                                store.find( 'project', item.get( 'project_id' ) ).then( function( project ){
                                    item.get( 'company' ).then( function( company ){
                                        self.set( 'title', company.get( 'name' ) );
                                    } );
                                    self.set( 'description', '<i class="fa fa-sitemap fa-fw"></i>Points P-' + project.get( 'name' ) );
                                } );
                                break;
                            case 'fund':
                                self.set( 'title', 'F-' + item.get( 'name' ) );
                                self.set( 'description', 'Fund Investment' );
                                break;
                            case 'invoice':
                                if( item.get( 'type' ) === 0 ){
                                    item.get( 'node' ).then( function( node ){
                                        if( item.get( 'company_id' ) === self.get( 'company_id' ) ){
                                            store.find( 'node', node.get( 'parent_id' ) ).then( function( bnode ){
                                                bnode.get( 'company' ).then( function( company ){
                                                    self.set( 'title', company.get( 'name' ) );
                                                    self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + company.get( 'account_number' ) + ' <i class="fa fa-file-text-o fa-fw"></i>Invoice I-' + item.get( 'name' ) );
                                                } );
                                            } );
                                        }
                                        else{
                                            if( !Ember.isEmpty( node.get( 'fund_id' ) ) ){
                                                node.get( 'fund' ).then( function( fund ){

                                                    if( !Ember.isEmpty( fund ) && fund.get( 'investor_id' ) === self.get( 'company_id' ) ){
                                                        store.find( 'node', node.get( 'parent_id' ) ).then( function( bnode ){
                                                            bnode.get( 'company' ).then( function( company ){
                                                                self.set( 'title', company.get( 'name' ) );
                                                                self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + company.get( 'account_number' ) + ' <i class="fa fa-file-text-o fa-fw"></i>Invoice I-' + item.get( 'name' ) );
                                                            } );
                                                        } );
                                                    }
                                                    else{
                                                        item.get( 'company' ).then( function( company ){
                                                            self.set( 'title', company.get( 'name' ) );
                                                            self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + company.get( 'account_number' ) + ' <i class="fa fa-file-text-o fa-fw"></i>Invoice I-' + item.get( 'name' ) );
                                                        } );
                                                    }

                                                } );
                                            }
                                            else{
                                                item.get( 'company' ).then( function( company ){
                                                    self.set( 'title', company.get( 'name' ) );
                                                    self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + company.get( 'account_number' ) + ' <i class="fa fa-file-text-o fa-fw"></i>Invoice I-' + item.get( 'name' ) );
                                                } );
                                            }
                                        }
                                    } );
                                }
                                else if( item.get( 'type' ) === 1 || item.get( 'type' ) === 3 ){
                                    if( item.get( 'company_id' ) === self.get( 'company_id' ) ){
                                        store.find( 'company', item.get( 'to_company_id' ) ).then( function( toCompany ){
                                            self.set( 'title', toCompany.get( 'name' ) );
                                            self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + toCompany.get( 'account_number' ) + ' <i class="fa fa-file-text-o fa-fw"></i>Invoice I-' + item.get( 'name' ) );
                                        } );
                                    }
                                    else{
                                        item.get( 'company' ).then( function( company ){
                                            self.set( 'title', company.get( 'name' ) );
                                            self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + company.get( 'account_number' ) + ' <i class="fa fa-file-text-o fa-fw"></i>Invoice I-' + item.get( 'name' ) );
                                        } );
                                    }
                                }
                                else{

                                }
                                break;
                            case 'wire':
                                item.get( 'company' ).then( function( company ){
                                    if( company.get( 'id' ) === self.get( 'company_id' ) ){
                                        self.set( 'title', item.get( 'account_holder' ) );
                                    }
                                    else{
                                        self.set( 'title', company.get( 'name' ) );
                                    }
                                    self.set( 'description', '<i class="fa fa-refresh"></i> ' + item.get( 'str_method' ) + ' W-' + item.get( 'name' ) );
                                } );
                                break;
                            case 'commission-payment':
                                self.set( 'title', 'Commission Payment' );
                                self.set( 'description', 'Pay Out Date: ' + item.get( 'str_payout_date' ) );
                                break;
                            case 'fx-request':
                                self.set( 'title', 'FX-' + item.get( 'name' ) );
                                self.set( 'description', item.get( 'base_currency_id' ) + ' to ' + item.get( 'counter_currency_id' ) );
                                break;
                            default:

                        }
                    } );
                }
        }

        this._super();
    }
} );
