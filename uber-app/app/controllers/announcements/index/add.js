import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        "announcement.name": {
            presence: true
        },
        "announcement.publish_from": {
            presence: true
        },
        "announcement.publish_to": {
            presence: true
        },
        "announcement.notes": {
            presence: true
        }
    },

    actions: {
        createAnnouncement: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    var newAnnouncement = self.store.createRecord( 'Announcement', {
                        name: self.get( 'announcement.name' ),
                        publish_from: self.get( 'announcement.publish_from' ),
                        publish_to: self.get( 'announcement.publish_to' ),
                        notes: self.get( 'announcement.notes' )
                    } );
                    newAnnouncement.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:announcements.index' );
                            route.refresh();
                            //self.transitionToRoute( 'announcements.index.view', newAnnouncement.get( 'id' ) );
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