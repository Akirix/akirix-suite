import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( {
    activate: function(){
        document.title = config.APP.company.name + " | Not Found";
    }
} );
