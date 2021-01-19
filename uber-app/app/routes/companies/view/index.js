import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'company', this.modelFor( 'companies.view' ).get( 'id' ) );
    },

    setupController: function( controller, model ){
        controller.set( 'company', model );
        var promises = Ember.A();
        var currArry = [];
        controller.set('originalCompanyStatus', controller.get('company.status'));
        controller.set('statusChangeNotes', null);
        controller.store.find( 'account', { company_id: model.id } ).then( function( accounts ){
            accounts.forEach( function( account ){
                var currencyId = account.get( 'currency_id' );
                if( currArry.indexOf( currencyId ) === -1 ){
                    currArry.push( currencyId );
                    promises.push(
                        controller.store.find( 'currency', currencyId )
                    );
                }
            } );
            Ember.RSVP.all( promises ).then( function( curr ){
                controller.set( 'currencies', curr );
            } );
        } );
    },


    renderTemplate: function(){
        this.render( 'companies/nav-company', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
        this.render( 'companies/edit', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
        this.render( 'companies/details', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

    }
} );
