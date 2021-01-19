import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import lookupValidator from 'ember-changeset-validations';
import usersValidations from 'akx-app/validations/users';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, {
    passwordStrength: Ember.inject.service(),
    activate(){
        document.title = "User Settings";
    },
    model(){
        return this.store.findRecord( 'user', this.get( 'session.data.authenticated.user.id' ) );
    },
    setupController( controller, model ){
        this._super( ...arguments );
        let passwordStrength = this.get( 'passwordStrength' );
        let passwordError = controller.get( 'stringList.passwordError' );

        usersValidations[ 'password' ] = function( key, newValue ){
            return passwordStrength.strength( newValue || '' ).then( ( res )=>{
                if( res.score < 4 ){
                    return `${key} ${passwordError}`;
                }
                return true;
            } );
        };

        let changeset = new Changeset(
            model,
            lookupValidator( usersValidations ),
            usersValidations,
            { skipValidate: true }
        );

        controller.setProperties( {
            isLocked: false,
            success: false,
            changeset: changeset,
            credentials: ''
        } );
    },
    
    renderTemplate(){
        this.render( 'company/user', {
            into: 'authenticated'
        } );
    }
} );
