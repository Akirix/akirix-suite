import Ember from 'ember';

export default Ember.Component.extend( {
    globalPaneArray: null,
    model: null,
    model_id: null,
    uberTasks: null,
    company_id: null,
    store: Ember.inject.service(),
    tasksSort: [ 'status:asc', 'updated_at:desc', 'due_date:asc' ],
    sortedTasks: Ember.computed.sort( 'uberTasks', 'tasksSort' ),

    init: function(){
        this._super();
        this.loadData();
        Ember.set( this, 'globalPaneArray', this.get( 'applicationController' ).globalPaneArray );
    },

    modelUpdated: function(){
        this._super();
        this.loadData();
    }.observes( 'model', 'model_id', 'globalPaneArray.@each' ),

    loadData: function(){
        if( !Ember.isEmpty( this.get( 'model' ) ) && !Ember.isEmpty( this.get( 'model_id' ) ) ){
            this.store.find( 'uber-task', { model: this.get( 'model' ), model_id: this.get( 'model_id' ) } ).then( function( uberTasks ){
                if( !(this.get( 'isDestroyed' ) || this.get( 'isDestroying' )) ){
                    this.set( 'uberTasks', uberTasks );
                }
            }.bind( this ) );
        }
    },

    actions: {
        togglePane: function(){
            this.$( ".pane-toggle" ).toggle( 'slide', { direction: 'right' } );
            this.$( ".main-box" ).toggleClass( 'move-right-menu', 400 );
        },

        addToGlobalPane: function( model, model_id ){
            var self = this;
            if( !this.get( 'globalPaneArray' ).findBy( 'id', model_id ) ){
                Ember.get( this, 'globalPaneArray' ).pushObject( model );
            }
        },

        createNewItem: function( switchType ){
            var newItem;
            switch( switchType ){
                case 0:
                case 1:
                    newItem = this.get( 'store' ).createRecord( 'uberTask', {
                        type: switchType,
                        model: this.get( 'model' ),
                        model_id: this.get( 'model_id' ),
                        company_id: this.get( 'company_id' )
                    } );
                    break;
                case 2:
                    newItem = Ember.Object.create( {
                        type: switchType,
                        model: this.get( 'model' ),
                        model_id: this.get( 'model_id' ),
                        company_id: this.get( 'company_id' )
                    } );
                    Ember.set( newItem, 'constructor.typeKey', 'email' );
                    break;
                default:
            }
            this.get( 'globalPaneArray' ).pushObject( newItem );

        }
    }

} );
