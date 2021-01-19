import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    activate(){
        document.title = "Authenticators";
    },
    model(){
        return this.store.findAll( 'authenticator' )
    },

    renderTemplate(){
        this.render( 'company/authenticators', {
            into: 'authenticated'
        } );
    }
} );
