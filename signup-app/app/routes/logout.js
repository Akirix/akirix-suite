import Ember from 'ember';

export default Ember.Route.extend( {
    activate: function(){
        this._super();
        var _this = this;

        this.render( 'loading', {
            into: 'application'
        } );

        Ember.run.once( function(){
            var isAuthenticated = _this.get( 'session.isAuthenticated' );
            if( isAuthenticated ){
                _this.controllerFor( 'application' ).send( 'logout' );
            }
            else{
                window.location = window.ENV.APP_HOST + '/login';
            }
        } );
    }
} );
