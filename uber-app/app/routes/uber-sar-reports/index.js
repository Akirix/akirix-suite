import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {

    model: function( params ){
        return this.findPaged( 'uber-sar-report', params );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );

        controller.get( 'model' ).then( function( model ){
            model.forEach( function( item ){
                controller.store.find( 'uber-sar-submission', { uber_sar_report_id: item.id } ).then( function( uberSarSubmissions ){
                    item.set( 'uberSarSubmissions', uberSarSubmissions );
                } );
            } );
        } );
    },

    renderTemplate: function(){

        this.render( { outlet: 'panePrimary' } );
        this.render( 'pane-secondary', {
            into: 'uber-sar-reports',
            outlet: 'paneSecondary'
        } );
    }
} );
