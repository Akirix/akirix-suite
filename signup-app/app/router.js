import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend( {
    location: config.locationType
} );

Router.map( function(){
    // Non-authenticated routes
    this.route( 'login' );
    this.route( 'forgot' );
    this.route( 'sign-up' );
    this.route( 'logout' );
    this.route( 'email-verification' );

    // Authenticated Routes
    this.route( 'info' );
    this.route( 'password-reset' );

    this.resource( 'verification', function(){
        this.route( 'corporate-documents' );
        this.route( 'primary-id' );
        this.route( 'secondary-id' );
        this.route( 'tax-identity' );
        this.route( 'financial-identity' );
        this.route( 'proof-of-address' );
        this.route( 'w8-ben' );
        this.route( 'w8-ben-e' );
        this.route( 'owner-id' );
    } );

    this.route( 'documents' );
    this.route( 'questionnaire' );
    this.route( 'owners' );
    this.route( 'agreement' );
    this.route( 'agreement-print' );
    this.route( 'complete' );
    this.route( 'complete-final' );

    // Catch all route for misc paths
    this.route( 'not-found', { path: '/*path' } );
} );

export default Router;
