import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire', params.wire_id );
    },


    setupController: function( controller, model ){
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        var templatePath;
        switch( model.get( 'type' ) ){
            case 0:
                templatePath = 'wires/view-withdrawal';
                break;
            case 1:
                templatePath = 'wires/view-deposit';
                break;
            case 2:
                templatePath = 'wires/view-book-transfer';
                break;
            default:
        }

        this.render( templatePath, {
            into: 'wires',
            outlet: 'paneSecondary'
        } );
    }

} );


