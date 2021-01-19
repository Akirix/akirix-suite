import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'company', params.company_id );
    },

    setupController: function( controller, model ){
        controller.set( 'company', model );
        controller.store.find( 'uber-company-setting', { company_id: model.id } )
            .then( function( companySettings ){
                if( !Ember.isEmpty( companySettings ) && companySettings.toArray().length === 1 ){
                    controller.set( 'companySetting', companySettings.objectAt( 0 ) );
                }
                else{
                    controller.set( 'companySetting', {} );
                }
            } );

        controller.store.find( 'company-relationship', { company_id: model.id } )
            .then( function( relationships ){
                controller.set( 'companyRelationship', null );
                if( !Ember.isEmpty( relationships ) && relationships.toArray().length === 1 ){
                    controller.set( 'companyRelationship', relationships.objectAt( 0 ) );
                }
            } );

        this.send( 'recordHistory', 'company', model.id );
    },

    renderTemplate: function(){
        this.render( { outlet: 'panePrimary' } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' );
    },

    deactivate: function(){
        var controller = this.controllerFor( 'companies.view' );
        controller.set( 'relatedCompany', null );
    }
} );

