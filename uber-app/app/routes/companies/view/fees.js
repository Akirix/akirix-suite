import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function(){
        return this.store.find( 'fee', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } )
    },

    setupController: function( controller, model ){

        controller.set( 'fee', model.objectAt( 0 ) );
        var feeJSON = JSON.parse( model.objectAt( 0 ).get( 'fee_data' ) );

        controller.set( 'feeTable', feeJSON );

        var wireArr = Ember.A();
        for( var key in feeJSON.wire ){
            wireArr.push( { key: key, value: feeJSON.wire[ key ] } );
        }

        controller.set( 'wireArray', wireArr );
        controller.set( 'selectedType', null );
    },

    renderTemplate: function(){
        this.render( 'companies/nav-company', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
        this.render( 'companies/fees', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );
        this.render( 'pane-secondary', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    activate: function(){
        document.title = 'Manage fees';
    }
} )