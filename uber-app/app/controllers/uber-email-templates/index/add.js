import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        "uber-email-template.name": {
            presence: true
        },
        "uber-email-template.subject": {
            presence: true
        },
        "uber-email-template.content": {
            presence: true
        }
    },

    actions: {
        createUberEmailTemplate: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    var newUberEmailTemplate = self.store.createRecord( 'Uber-Email-Template', {
                        name: self.get( 'uber-email-template.name' ),
                        model: self.get( 'uber-email-template.model' ) || null,
                        subject: self.get( 'uber-email-template.subject' ),
                        content: self.get( 'uber-email-template.content' ),
                        email: self.get( 'uber-email-template.email' )
                    } );
                    newUberEmailTemplate.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:uber-email-templates.index' );
                            self.notify.success( 'Template Added', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'uber-email-templates.index' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                            self.set( 'isLocked', false );
                        }
                    );
                },
                function(){

                }
            );
        }
    }

} );