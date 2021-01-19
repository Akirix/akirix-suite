import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'div',
    classNames: '',
    placement: 'bottom',
    didInsertElement: function(){
        var component = this,
            contents = this.$( '.popoverJs' );
        component.$().popover( {
            animation: false,
            placement: component.get( 'placement' ),
            html: true,
            content: contents
        } ).on( 'show.bs.popover', function(){
            contents.removeClass( 'hide' );
        } );
    },
    willDestroyElement: function(){
        this.$().popover( 'destroy' );
    }

} );