import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function( params ){
        params.company_id = this.modelFor( 'companies.view' ).get( 'id' );
        return this.store.find( 'user', params );
    },

    setupController: function( controller, model ){
        var infoRequests = Ember.A();

        model.forEach( function( user ){
            controller.store.find( 'info-request', { model_id: user.get( 'id' ) } ).then( function( infoReqs ){
                if( infoReqs.get( 'length' ) > 0 )
                infoRequests.pushObject( infoReqs )
            } )
        } );
        controller.store.find( 'info-request', { model_id: this.modelFor( 'companies.view' ).get( 'id' ) } ).then(
            function( IR ){
                if( IR.get( 'length' ) > 0 )
                infoRequests.pushObject( IR );
            }
        );
        controller.set( 'model', infoRequests );
    },

    renderTemplate: function(){
        this.render( 'companies/info-requests', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-info-requests', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    }
} );