import Ember from 'ember';

export default Ember.Mixin.create( {
    runOnce: false,

    activate(){
        Ember.run.scheduleOnce( 'afterRender', ()=>{
            this.set( 'runOnce', true );
        } );
    }
} );