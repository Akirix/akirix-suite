import Ember from 'ember';

export default Ember.View.extend( {
    templateName: 'views/invoice-index-name',

    title: function(){
        return this.get( 'invoice.to_company_name' );
    }.property( 'invoice.to_company_name' ),

    description: function(){
        return this.get( 'invoice.to_company_email' );
    }.property( 'invoice.to_company_email' ),

    init: function(){
        var self = this;
        var store = this.get( 'controller' ).get( 'store' );
        store.find( 'invoice', this.get( 'invoice_id' ) ).then( function( invoice ){
            // Project Invoice
            if( invoice.get( 'type' ) === 0 ){
                invoice.get( 'node' ).then( function( node ){
                    store.find( 'node', node.get( 'parent_id' ) ).then( function( bnode ){
                        bnode.get( 'company' ).then( function( company ){
                            self.set( 'title', company.get( 'name' ) );
                            invoice.get( 'project' ).then( function( project ){
                                self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + company.get( 'account_number' ) + ' <i class="fa fa-sitemap fa-fw"></i>Project P-' + project.get( 'name' ) );
                            } );
                        } );
                    } );
                } );
            }
            else if( invoice.get( 'type' ) === 1 || invoice.get( 'type' ) === 3 ){
                // One time on platform
                store.find( 'company', invoice.get( 'to_company_id' ) ).then( function( toCompany ){
                    self.set( 'title', toCompany.get( 'name' ) );
                    self.set( 'description', '<i class="fa fa-at fa-fw"></i>XYZ' + toCompany.get( 'account_number' ) );
                } );
            }
            else if( invoice.get( 'type' ) === 2 ){
                // One time off platform
                self.set( 'title', invoice.get( 'to_company_name' ) );
                self.set( 'description', invoice.get( 'to_company_email' ) );
            }
        } );

        this._super();
    }
} );
