import Ember from 'ember';
import config from 'uber-app/config/environment';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        var self = this;
        var preferredFlag = params.preferred ? params.preferred : 'false';
        return Ember.$.get( config.APP.uber_api_host + '/wireInstructions/' + params.wire_instruction_id + '?preferred=' + preferredFlag ).then( function( result ){
            return self.store.push( 'wire-instruction', self.store.normalize( 'wire-instruction', result.wireInstruction ) );
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'company', this.modelFor( 'companies.view' ) );
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wire-instructions/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );