import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Component.extend( EmberValidations.Mixin, {
    init: function(){
        this._super();
        var modelName = this.get( 'item.constructor.typeKey' );
        switch( modelName ){
            case 'uberTask':
                this.set( 'viewer', 'pane-task-note' );
                break;
            case 'email':
                this.set( 'viewer', 'pane-email' );
                break;
            default:
            //Do nothing, should show blank template;
        }
    },
} );

