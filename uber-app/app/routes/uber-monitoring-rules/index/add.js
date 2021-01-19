import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.createRecord( 'uber-mon-rule' );
    },
    renderTemplate: function(){
        this.render( 'uber-monitoring-rules/add', {
            into: 'uber-monitoring-rules',
            outlet: 'paneSecondary'
        } );
    }
} );