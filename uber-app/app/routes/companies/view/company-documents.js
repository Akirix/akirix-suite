import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        params[ 'company_id' ] = this.modelFor( 'companies.view' ).get( 'id' );
        params[ 'model' ] = 'registration';
        return Ember.RSVP.hash( {
            uberdocument: this.findPaged( 'uber-document', params ),
            documentTypes: this.get( 'akxUtil' )._sendRequest( '/signupDocumentTypes', 'get' ).then( function( result ){
                return result.data.documentTypes;
            } )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        model.documentTypes.forEach( function( documentType ){
            var currentDocuments = model.uberdocument.filterBy( 'category', documentType.name );
            Ember.set( documentType, 'documents', currentDocuments );
        } );

        controller.set( 'registrations', model.uberdocument.filter( ( doc )=>{
            return doc.get( 'category' ) === 'registration';
        } ) );
    },

    renderTemplate: function(){
        this.render( 'companies/nav-company', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
        this.render('companies/company-documents', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        });
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Company Documents';
    },

    actions: {
        refreshCompanyDocument: function(){
            this.refresh();
        }
    }
} );
