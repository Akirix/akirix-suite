import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        "model.name": {
            presence: true
        },
        "model.subject": {
            presence: true
        },
        "model.content": {
            presence: true
        }
    },

    actions: {
        save: function(){
            var _this = this;
            _this.set( 'isLocked', true );

            _this.validate().then( function(){
                _this.get( 'model' ).save().then( function(){
                    _this.set( 'isLocked', false );
                    _this.notify.success( 'Uber Email Template Updated', { closeAfter: 5000 } );
                    var route = _this.container.lookup( 'route:uber-email-templates.index' );
                    route.refresh();
                }, function( xhr ){
                    _this.get( 'akxUtil' ).handleError( xhr, {
                        scope: _this
                    } );
                } );
            }, function( errors ){
                _this.set( 'isLocked', false );
            } );
        },

        delete: function( template ){
            var self = this;
            this.set( 'isLocked', true );
            template.destroyRecord( template.id )
                .then( function(){
                    self.set( 'isLocked', false );
                    var route = self.container.lookup( 'route:uber-email-templates.index' );
                    self.notify.success( 'Uber Email Template Deleted' );
                    route.refresh();
                    self.transitionToRoute( 'uber-email-templates.index' );
                } )
                .catch( function( errorObj ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( errorObj, { scope: self } );
                } );
        }
    }

} );
