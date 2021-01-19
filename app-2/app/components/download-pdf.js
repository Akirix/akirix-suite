import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'd-inline' ],
    name: 'side-nav-view-get-pdf',
    attributeBindings: [ 'name' ],
    spinner: '<div class="icon-spin mr-4"><i class="akx-icon akx-pending text-primary"></i></div>',
    session: Ember.inject.service( 'session' ),

    didInsertElement(){
        this.set( 'originalHTML', this.$().html() );
    },

    click(){
        if( !this.get( 'isLocked' ) ){
            this.set( 'isLocked', true );
            this.$().html( this.get( 'spinner' ) );
            window.open(
                `${this.get( 'model.urlPdf' )}?token=${this.get( 'session.data.authenticated.access_token' )}`,
                '_self'
            );
            Ember.run.later( ()=>{
                this.set( 'isLocked', false );
                this.$().html( this.get( 'originalHTML' ) );
            }, 9000 );
        }
    }
} );