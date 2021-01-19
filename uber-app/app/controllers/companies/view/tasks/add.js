import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        'task.type': {
            presence: true
        },
        'task.title': {
            presence: true
        },
        'task.notes_new': {
            presence: true
        }
    },

    priorities: [
        { label: 'Low', val: 0 },
        { label: 'Normal', val: 1 },
        { label: 'High', val: 2 }
    ],

    sentiments: [
        { label: 'Negative', val: 0 },
        { label: 'Neutral', val: 1 },
        { label: 'Positive', val: 2 }
    ],

    isTask: function(){
        return this.get( 'task.type' ) === '0';
    }.property( 'task.type' ),

    isNote: function(){
        return this.get( 'task.type' ) === '1';
    }.property( 'task.type' ),


    actions: {
        createTask: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );


                    var newTask = self.store.createRecord( 'uber-task', self.get( 'task' ) );
                    newTask.set( 'type', parseInt( newTask.get( 'type' ) ) );
                    newTask.set( 'company_id', self.get( 'company_id' ) );

                    newTask.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var promises = Ember.A();
                            // Save Documents
                            self.get( 'documents' ).forEach( function( item ){
                                Ember.set( item, 'model_id', newTask.id );
                                Ember.set( item, 'company_id', self.get( 'company_id' ) );
                                Ember.set( item, 'status', 1 );
                                promises.push( item.save() );
                            } );

                            var route = self.container.lookup( 'route:companies.view.tasks' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.tasks.view', newTask.id );
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