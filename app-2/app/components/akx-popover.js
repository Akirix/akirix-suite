import Ember from 'ember';

export default Ember.Component.extend( {

    didInsertElement(){
        this._super(...arguments);
        let parent = this.$().parent();
        parent.popover( {
            title: '',
            html: true,
            container: this.get( 'container' ),
            content: this.$().html(),
            placement: this.get( 'placement' ) || 'auto'
        } );
        this.$().addClass( 'display-none' );
    }
} );