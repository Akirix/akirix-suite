import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-authenticator' );
    },

    setupController: function( controller, model ){
        model.content.forEach( function( item, key ){
            item.set( 'canRemove', item.get( 'type' ) !== 3 );
        } );

        controller.set( 'authenticators', model );

        Ember.run.schedule( 'afterRender', this, function(){
            var codeField = Ember.$( '#authentication_code' );
            if( codeField.length > 0 ){
                controller.set( 'data.code', null );
                codeField.focus();
            }
        } );
    },

    renderTemplate: function( controller, model ){

        this.render( { outlet: 'panePrimary' } );
        this.render( 'pane-secondary', {
            into: 'authenticators',
            outlet: 'paneSecondary'
        } );
    }

} );

