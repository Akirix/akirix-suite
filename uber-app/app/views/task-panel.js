import Ember from 'ember';

export default Ember.View.extend( {
    layoutName: 'views/task-panel',
    classNames: [ 'tasks' ],
    isLocked: false,
    models: [],
    documents: [],
    users: [],
    showComplete: false,
    tasks: function(){
        var tasks = this.get( 'models' ).filterBy( 'type', 0 );

        if( !this.get( 'showComplete' ) ){
            tasks = tasks.filter( function( item, index, enumerable ){
                var status = item.get( 'status' );
                return status === 0 || status === 1;
            } );
        }

        return tasks.sortBy( 'due_date' );
    }.property( 'models', 'showComplete' ),
    notes: function(){
        return this.get( 'models' ).filterBy( 'type', 1 );
    }.property( 'models' ),
    staged: function(){
        return this.get( 'models' ).filterBy( 'staged', true );
    }.property( 'models' ),
    modelsWatcher: function(){
        this.send( 'arrangeTasks' );
    }.observes( 'models' ),
    updateStore: function(){
        var stagedTasks = this.get( 'staged' );
        var taskIds = [];
        stagedTasks.forEach( function( task ){
            taskIds.pushObject( { id: task.id, collapsed: task.collapsed } );
        } );

        localStorage.setItem( 'staged-tasks', JSON.stringify( taskIds ) );
    },

    init: function(){
        var _this = this;
        _this._super();

        this.send( 'updateTasks' );

        this.get( 'controller.store' ).find( 'uber-user' ).then( function( users ){
            _this.set( 'users', users );
        }, function(){
        } );
    },

    didInsertElement: function(){
        this.send( 'arrangeTasks' );
    },

    actions: {
        addNote: function(){
            this.send( 'addTask', 1 );
        },

        addTask: function( type ){
            var _this = this;
            var store = this.get( 'controller.store' );

            if( Ember.isEmpty( type ) ){
                type = 0;
            }

            store.createRecord( 'uber-task', {
                user_id: _this.get( 'user.id' ),
                type: type,
                status: 0
            } )
                .save()
                .then( function( task ){
                    _this.send( 'openTask', task );
                }, function(){
                } );

        },

        updateDocuments: function(){
            var _this = this;
            var store = this.get( 'controller.store' );
            store.find( 'uber-document', { user_id: _this.get( 'session.user.id' ) } ).then( function( documents ){
                _this.set( 'documents', documents );
                _this.propertyDidChange( 'documents' );
            }, function(){
            } );
        },

        updateTasks: function(){
            var _this = this;
            var store = this.get( 'controller.store' );
            store.find( 'uber-task' ).then( function( uberTasks ){

                var stagedItems = localStorage.getItem( 'staged-tasks' );
                if( !Ember.isEmpty( stagedItems ) ){
                    stagedItems = JSON.parse( stagedItems );
                }
                else{
                    stagedItems = [];
                }

                uberTasks.forEach( function( task ){

                    var stagedItem = stagedItems.findBy( 'id', task.id );
                    if( !Ember.isEmpty( stagedItem ) ){
                        task.setProperties( {
                            collapsed: stagedItem.collapsed,
                            staged: true
                        } );
                    }
                    else{
                        task.setProperties( {
                            collapsed: true,
                            staged: false
                        } );
                    }
                } );

                _this.set( 'models', uberTasks );
            }, function(){
            } );
        },

        arrangeTasks: function(){
            Ember.run.scheduleOnce( 'afterRender', this, function(){
                var currentPosition = 15;
                var tasks = Ember.$( '.task' );
                tasks.each( function( key, task ){
                    var theTask = Ember.$( task );
                    var width = theTask.outerWidth();

                    theTask.css( { left: currentPosition } );
                    currentPosition += width + 15;
                } );
            } );
        },

        togglePane: function(){
            Ember.$( 'body' ).toggleClass( 'open-pane' );
        },

        openTask: function( task ){
            Ember.set( task, 'staged', true );
            Ember.set( task, 'collapsed', false );

            this.propertyDidChange( 'models' );
            this.updateStore();
            this.send( 'arrangeTasks' );
        }
    }
} );
