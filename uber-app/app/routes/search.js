import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        var self = this;
        var akxUtil = this.get( 'akxUtil' );
        this.controllerFor( 'application' ).set( 'searchValue', params.value );
        this.controllerFor( 'search' ).set( 'currentSearch', params.value );
    },

    activate: function(){
        document.title = "Search";
    }
} );
