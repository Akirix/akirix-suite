import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    setupController: function( controller ){
        controller.set( 'uber-email-template', {
            model: null,
            subject: null,
            name: null,
            content: null
        } );
        var list = [
            {
                modelName: "Account",
                modelValue: "Account"
            },
            {
                modelName: "Company",
                modelValue: "Company"
            },
            {
                modelName: "FX Request",
                modelValue: "FXRequest"
            },
            {
                modelName: "Investor",
                modelValue: "Investor"
            },
            {
                modelName: "Invoice",
                modelValue: "Invoice"
            },
            {
                modelName: "Ticket",
                modelValue: "Ticket"
            },
            {
                modelName: "Transaction",
                modelValue: "Transaction"
            },
            {
                modelName: "User",
                modelValue: "User"
            },
            {
                modelName: "Wire",
                modelValue: "Wire"
            }
        ];
        controller.set( 'modelList', list );

    },

    renderTemplate: function( controller ){
        this.render( 'uber-email-templates/add', {
            into: 'uber-email-templates',
            outlet: 'paneSecondary'
        } );
    }

} );