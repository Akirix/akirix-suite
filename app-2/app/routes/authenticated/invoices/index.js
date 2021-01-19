import Ember from 'ember';

export default Ember.Route.extend( {
    activate(){
        this.transitionTo( 'authenticated.invoices.invoices' );
    }
} );