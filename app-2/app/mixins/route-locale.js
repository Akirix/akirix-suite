import Ember from 'ember';

export default Ember.Mixin.create( {
    setupController( controller ){
        this._super( ...arguments );
        controller.set( 'stringList', Ember.get( this.get( 'localeFile' ), this.get( 'routeName' ) ) );
    }
} );
