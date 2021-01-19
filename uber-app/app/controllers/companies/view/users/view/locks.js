import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend( {
    needs: [ 'companies/view/users/view' ],
    userBinding: 'controllers.companies/view/users/view.model',

    hasActiveLock: function(){
        return this.get( 'model' ).filterBy( 'status', 1 ).length > 0;
    }.property( 'model' ),

    actions: {
        remove: function( lock ){
            var self = this;
            lock.destroyRecord().then(
                function(){
                    var route = self.container.lookup( 'route:companies.view.users.view.locks' );
                    route.refresh();
                    self.notify.success( 'The lock has been removed.', { closeAfter: 5000 } );
                },
                function( xhr ){
                    lock.rollback();
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }
    }
} );
