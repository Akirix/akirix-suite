import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.get( 'akxUtil' )._sendRequest( '/signupDocumentTypes', 'get' ).then( function( result ){
            return result.data;
        } );
    },

    setupController: function( controller, model ){
        this._super( controller, model );

        controller.set( 'documentData', {
            model: 'registration',
            company_id: this.modelFor( 'companies.view' ).get( 'id' ),
            uber_user_id: this.get( 'session.user.id' ),
            status: 1,
            protected: 1
        } );
        controller.set( 'url', config.APP.uber_api_host + '/uberDocuments' );
    },

    renderTemplate: function(){
        this.render( 'companies/company-documents/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    actions: {
        refresh: function(){
            this.refresh();
        }
    }
} );


