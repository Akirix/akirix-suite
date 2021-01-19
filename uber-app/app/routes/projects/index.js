import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, AdvancedSearchRouteMixin, {
    page: 1,
    perPage: 50,

    queryParams: {
        type: { refreshModel: true },
        deterministic: { refreshModel: true },
    },

    model: function( params ){
        return this.findPaged( 'project', params );
    },


    renderTemplate: function( controller, model ){
        this.render( 'projects/index', {
            into: 'projects',
            outlet: 'panePrimary'
        } );

        this.render( 'projects/help-index', {
            into: 'projects',
            outlet: 'paneSecondary'
        } );
    }

} );