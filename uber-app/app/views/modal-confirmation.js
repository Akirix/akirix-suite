import Ember from 'ember';

export default Ember.View.extend( {
    needs: [ 'authenticators' ],
    tagName: 'button',
    attributeBindings: [ 'type' ],
    type: 'button',
    button: null,

    didInsertElement: function(){
        var _this = this;
        var element = this.$();
        var button = _this.get( 'button' );
        element.html( button );
    },

    click: function( event ){
        var headerTitle = this.get( 'headerTitle' );
        var prompt = this.get( 'prompt' );
        var action = this.get( 'action' );
        var actionContext = this.get( 'actionContext' );
        var validate = this.get( 'validate' );

        var controller = this.get( 'controller' );
        var applicationController = this.get( 'controller.controllers.application' );
        var applicationRoute = this.get( 'controller.controllers.application.target' );

        applicationController.set( 'modal', {
            headerTitle: headerTitle,
            prompt: prompt,
            action: action,
            actionContext: actionContext,
            targetView: this
        } );

        if( validate && typeof controller.validate === 'function' ){
            controller.validate().then( function(){
                applicationRoute.send( 'openModal', 'views/modal-confirmation' );
            } );
        }
        else{
            applicationRoute.send( 'openModal', 'views/modal-confirmation' );
        }
    },

    actions: {
        confirm: function(){
            var applicationRoute = this.get( 'controller.controllers.application.target' );
            var controller = this.get( 'controller' );

            var action = this.get( 'action' );
            var actionContext = this.get( 'actionContext' );

            applicationRoute.send( 'closeModal' );
            controller.send( action, actionContext );
        }
    }
} );
