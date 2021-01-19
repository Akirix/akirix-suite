import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'row' ],

    callDrawOnInit: function(){
        this.redraw();
    }.on( 'init' ),

    redraw: function(){
        let steps = this.get( 'steps' );
        let currentStep = this.get( 'currentStep' );
        if( currentStep < steps.length ){
            this.get( 'steps' ).forEach( ( step, idx )=>{
                Ember.set( step, 'completed', idx < currentStep );
                Ember.set( step, 'active', idx === currentStep );
            } );
            this.set( 'currentStepItem', steps[ currentStep ] );
            this.set( 'template', steps[ currentStep ].template );
            this.set( 'show', steps[ currentStep ].show );
        }
    },

    currentStepUpdated: function(){
        this.redraw();
    }.observes( 'currentStep' ),

    watchSteps: function(){
        this.redraw();
    }.observes( 'steps.@each.template' ),

    lastStep: function(){
        return this.get( 'currentStep' ) === ( this.get( 'steps' ).length - 1 )
    }.property( 'currentStep' ),

    actions: {
        goToStep( idx ){
            let steps = this.get( 'steps' );
            let targetStepItem = steps[ idx ];
            if( targetStepItem.completed ){
                if( !Ember.isEmpty( targetStepItem ) ){
                    if( !Ember.isEmpty( targetStepItem.link ) ){
                        targetStepItem.transitionToUri( targetStepItem );
                    }
                    else{
                        // this.runBeforeExit();
                        let changeset = targetStepItem.changeset;
                        if( !Ember.isEmpty( changeset.get( 'errors' ) ) ) {
                          Ember.set(changeset, '_errors', {});
                        }
                        this.set( 'currentStep', idx );
                    }
                }
            }
        }
    }
} );
