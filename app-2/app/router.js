import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route( 'login' );
  this.route( 'forgot' );
  this.route( 'sign-up' );
  this.route( 'password-reset' );
  this.route( 'authenticated', function(){
    this.route( 'dashboard', function(){
      this.route( 'view', { path: '/:account_id' } );
    } );
    this.route( 'accounts', function(){
      this.route( 'add-account' );
      this.route( 'view-request', { path: 'view-request/:ticket_id' } );
      this.route( 'view', { path: ':account_id' }, function(){
        this.route( 'view-transaction', { path: '/view-transaction/:transaction_id' } );
        this.route( 'download', { path: '/download' } );
      } );
      this.route( 'edit', { path: '/edit/:account_id' } );
      this.route( 'statements', { path: '/statements/:account_id' } );
    } );
    this.route( 'transfers', function(){
      this.route( 'wire-templates', function(){
        this.route( 'add' );
        this.route( 'view', { path: ':wire_template_id' } );
        this.route( 'edit', { path: '/edit/:wire_template_id' } );
        this.route( 'success' );
      } );
      this.route( 'wire-instructions', function(){
        this.route( 'view', { path: '/:account_id' } );
      } );
      this.route( 'view', { path: '/:wire_id' } );
      this.route( 'wire-options' );
      this.route( 'book-transfer' );
      this.route( 'bank-transfer' );
      this.route( 'account-transfer' );
      this.route( 'success' );
    } );
    this.route( 'projects', function(){
      this.route( 'view-invitation', { path: 'view-invitation/:project_id/:node_id' } );
      this.route( 'view', { path: ':project_id' }, function(){
        this.route( 'add', function(){
          this.route( 'success' );
        } );
        this.route( 'add-buyer' );
        this.route( 'add-supplier' );
        this.route( 'project-details' );
        this.route( 'commit-funds', { path: 'commit-funds/:node_id' } );
        this.route( 'node-documents', { path: 'documents/:node_id' } );
        this.route( 'view-external-node', { path: '/externalNodes/:external_node_id' } );
        this.route( 'invoices', { path: 'invoices/:node_id' }, function(){
          this.route( 'edit', { path: '/edit/:invoice_id' } );
          this.route( 'view-invoice', { path: '/:invoice_id' }, function(){
            this.route( 'pay-invoice', { path: 'pay/:invoice_id' } );
          } );
        } );
        this.route( 'node-items', { path: 'nodeItems/:node_id' } );
        this.route( 'return-funds' );
        this.route( 'add-generic-invoice' );
        this.route( 'add-linear-invoice' );
      } );
    } );
    this.route( 'invoices', function(){
      this.route( 'invoices', function(){
        this.route( 'view', { path: ':invoice_id' } );
        this.route( 'edit', { path: 'edit/:invoice_id' } );
        this.route( 'add' );
        this.route( 'success' );
      } );
      this.route( 'bills', function(){
        this.route( 'view', { path: ':invoice_id' }, function(){
          this.route( 'pay', { path: ':invoice_id/pay' } );
        } );
      } );
    } );
    this.route( 'fxRequests' );
    this.route( 'tickets', function(){
      this.route( 'view', { path: '/view/:ticket_id' } );
      this.route( 'add' );
    } );
    this.route( 'company' );
    this.route( 'user' );
    this.route( 'authenticators', function(){
      this.route( 'add-authenticator' );
    } );
  } );
});

export default Router;
