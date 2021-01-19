import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import AdvancedSearchRouteMixin from 'uber-app/mixins/advanced-search-route';

export default Ember.Route.extend(  AuthenticatedRouteMixin,  AdvancedSearchRouteMixin,{
    activate: function(){
        document.title = "Wire Instructions";
    }

} );