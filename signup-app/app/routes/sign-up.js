import Ember from 'ember';

export default Ember.Route.extend( {
    activate: function(){
        document.title = "Sign Up";
    },
    
    model: function(){
        return {
            email: null,
            emailConfirmation: null,
            password: null,
            passwordConfirmation: null
        };
    }
} );