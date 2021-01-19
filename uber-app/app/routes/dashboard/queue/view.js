import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire', params.wire_id );
    },

    renderTemplate: function( controller, model ){
        var templatePath;
        switch( model.get( 'type' ) ){
            case 0:
                templatePath = 'dashboard/wire-summary/view-withdrawal';
                break;
            case 1:
                templatePath = 'dashboard/wire-summary/view-deposit';
                break;
            case 2:
                templatePath = 'dashboard/wire-summary/view-book-transfer';
                break;
            default:
        }

        this.render( templatePath, {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }

} );


