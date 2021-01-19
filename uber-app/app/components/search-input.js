import Ember from 'ember';

export default Ember.Component.extend( {

    init: function(){
        this._super();

        switch( this.get( 'param.input_type' ) ){
            case 'dropdown':
                this.set( 'layoutName', 'components/search-dropdown' );
                break;
            case 'text':
                this.set( 'layoutName', 'components/search-text' );
                break;
            default:
                break;
        }
    },

    didInsertElement: function(){
        this._super();
        var controller = this.get( 'parentController' );
        var searchVar = this.get( 'param.variable' );
        var currentValue = controller.get( searchVar );
        this.set( 'value', currentValue );
    },

    valUpdated: function(){
        var theValue = this.get( 'value' );
        var controller = this.get( 'parentController' );
        var searchVar = this.get( 'param.variable' );
        controller.set( searchVar, theValue );
    }.observes( 'value' )


} );
