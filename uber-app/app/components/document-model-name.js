import Ember from "ember";

export default Ember.Component.extend( {
    store: Ember.inject.service(),
    title: null,

    init: function(){
        this._super();
        var self = this;
        if( this.get( 'document.model_id' ) ){
            this.get( 'store' ).find( this.get( 'document.model' ), this.get( 'document.model_id' ) )
                .then( function( item ){
                    switch( self.get( 'document.model' ) ){
                        case 'uber-task':
                            self.set( 'title', 'Task: ' + item.get( 'title' ) );
                            break;
                        case 'invoice':
                            self.set( 'title', 'Invoice: I-' + item.get( 'name' ) );
                            break;
                        case 'project':
                            self.set( 'title', 'Project: P-' + item.get( 'name' ) );
                            break;
                        case 'node':
                            self.get( 'store' ).find( 'project', item.get( 'project_id' ) ).then( function( project ){
                                self.set( 'title', 'Project: P-' + project.get( 'name' ) + ' Node' );
                            } );
                            break;
                        case 'ticket-message':
                            item.get( 'ticket' ).then( function( ticket ){
                                self.set( 'title', 'Ticket: ' + ticket.get( 'name' ) );
                            } );

                            break;
                        default:

                    }
                } );
        }
        this.set( 'title', this.get( 'document.model' ) );
    },

    didInsertElement: function(){
        this._super();
    }
} );