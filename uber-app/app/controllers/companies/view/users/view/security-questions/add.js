import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    validations: {
        'securityQuestion.question': {
            presence: true
        },
        'securityQuestion.answer': {
            presence: true
        }
    },

    actions: {
        addSecurityQuestion: function(){
            var self = this;
            self.validate().then(
                function(){
                    var newQuestion = self.store.createRecord( 'security-question', {
                        user_id: self.get( 'user.id' ),
                        company_id: self.get( 'user.company_id' ),
                        question: self.get( 'securityQuestion.question' ),
                        answer: self.get( 'securityQuestion.answer' )
                    } );

                    newQuestion.save().then(
                        function(){
                            self.notify.success( 'Security Question added.', { closeAfter: 5000 } );
                            var route = self.container.lookup( 'route:companies.view.users.view.security-questions' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.users.view.security-questions' );
                        },
                        function(){
                            self.notify.error( 'An error has occurred', { closeAfter: 5000 } );
                        }
                    );
                },
                function(){
                }
            )

        }
    }
} );