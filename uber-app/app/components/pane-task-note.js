import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Component.extend( EmberValidations.Mixin, {
    globalPaneArray: null,
    item: null,
    itm: null,
    task: null,
    uberUsers: null,
    originalNotes: null,
    store: Ember.inject.service(),
    documents: null,
    minMaxClass: 'in',
    minMaxIcon: 'fa-window-minimize',

    sentiments: [
        { label: 'Negative', val: 0 },
        { label: 'Neutral', val: 1 },
        { label: 'Positive', val: 2 }
    ],

    status: [
        { label: 'Not Started', val: 0 },
        { label: 'In Progress', val: 1 },
        { label: 'Completed', val: 2 }
    ],
    priorities: [
        { label: 'Low', val: 0 },
        { label: 'Normal', val: 1 },
        { label: 'High', val: 2 }
    ],

    validations: {
        'item.title': {
            presence: true
        },
        'item.notes_new': {
            presence: true
        }
    },

    init: function(){
        this._super();
        switch( this.get( 'item.type' ) ){
            case 0:
                this.set( 'layoutName', 'components/pane-task' );
                break;
            case 1:
                this.set( 'layoutName', 'components/pane-note' );
                break;
            default:
            // Do nothing
        }
    },

    didInsertElement: function(){
        this._super();
        var self = this;
        if( !Ember.isEmpty( this.get( 'item.id' ) ) ){
            this.get( 'store' ).find( 'uber-document', { model: 'uber-task', model_id: this.get( 'item.id' ) } ).then( function( documents ){
                if( !documents ){
                    self.set( 'documents', Ember.A() );
                }
                else{
                    self.set( 'documents', documents );
                }
            } );
        }
        else{
            self.set( 'documents', Ember.A() );
        }
        this.store.find( 'uber-user' ).then( function( uberUsers ){
            self.set( 'uberUsers', uberUsers );
        } );
        this.set( 'globalPaneArray', Ember.get( this, 'globalPaneArray' ) );
    },

    actions: {
        removeFromGlobalPane: function( item ){
            this.get( 'globalPaneArray' ).removeObject( item );
            if( item.get( 'isNew' ) ){
                item.transitionTo( 'deleted.saved' );
            }
        },

        toggleMinMax: function(){
            if( this.get( 'minMaxClass' ) === 'in' ){
                this.set( 'minMaxClass', '' );
                this.set( 'minMaxIcon', 'fa-window-maximize' );
            }
            else{
                this.set( 'minMaxClass', 'in' );
                this.set( 'minMaxIcon', 'fa-window-minimize' );
            }
        },

        saveItem: function(){
            var self = this;
            var item = this.get( 'item' );
            var isNew = item.get( 'isNew' );
            self.validate().then(
                function(){
                    item.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            if( isNew ){
                                var promises = Ember.A();
                                // Save Documents
                                self.get( 'documents' ).forEach( function( doc ){
                                    doc.set( 'model_id', item.get( 'id' ) );
                                    doc.set( 'company_id', item.get( 'company_id' ) );
                                    doc.set( 'status', 1 );
                                    promises.push( doc.save() );
                                } );
                            }
                            self.notify.success( 'Created', { closeAfter: 5000 } );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        }
                    );
                },
                function(){

                }
            );
        }
    }
} );

