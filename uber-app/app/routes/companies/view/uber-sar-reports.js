import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';


export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function( params ){
        return this.store.find( 'uber-sar-report-relation', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } );
    },

    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'model', model );

        model.forEach( function( item ){
            controller.store.find('uber-sar-report', item.get('uber_sar_report_id')).then(function( report ){
                item.set('report_name', report.get('name'));
                item.set('report_date', moment( report.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' ));
                item.set('report_status', report.get('status'));
            });
        });
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/uber-sar-reports', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | SAR Reports';
    },


} );
