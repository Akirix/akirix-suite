import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-mon-rule', params.uber_mon_rule_id );
    },
    setupController: function( controller, model ){
        controller.set( 'model', model );
        model.get( 'ruleObj' ).forEach( function( field ){
            field[ 'errors' ] = { name: '', match_type: '', value: '' };
        } );
    },
    renderTemplate: function(){
        this.render( 'uber-monitoring-rules/view', {
            into: 'uber-monitoring-rules',
            outlet: 'paneSecondary'
        } );
    }
} );