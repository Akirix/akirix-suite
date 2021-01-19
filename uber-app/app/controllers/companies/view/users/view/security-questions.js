import Ember from 'ember';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    actions: {
        deleteSecurityQuestion: function( securityQuestion ){
            var self = this;
            securityQuestion.deleteRecord();
            securityQuestion.save().then(
                function(){
                    self.notify.success( 'Security Question removed.', { closeAfter: 5000 } );
                    self.transitionToRoute( 'companies.view.users.view.security-questions' );
                    var route = self.container.lookup( 'route:companies.view.users.view.security-questions' );
                    route.refresh();
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } )
                }
            )
        }
    }
} );