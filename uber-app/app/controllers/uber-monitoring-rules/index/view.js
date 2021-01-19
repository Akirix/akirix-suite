import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment'

export default Ember.Controller.extend( EmberValidations.Mixin, {

    isEditing: false,
    modelOptions: [ 'wire' ],
    matchTypes: [
        { label: 'Like', value: 'LIKE' },
        { label: 'Not Like', value: 'NOT LIKE' },
        { label: '<', value: '<' },
        { label: '>', value: '>' },
        { label: 'In', value: 'IN' },
        { label: 'Not In', value: 'NOT IN' },
        { label: '=', value: '=' },
        { label: '!=', value: '!=' }
    ],

    validations: {
        "model.model": {
            presence: true
        },
        "model.name": {
            length: { maximum: 36 }
        }
    },

    getModelFields: function(){
        if( this.get( 'model.model' ) ){
            var newModel = this.store.modelFor( this.get( 'model.model' ) );
            var props = Ember.A();
            Ember.get( newModel, 'attributes' ).forEach( function( meta, name ){
                if( typeof newModel[ name ] !== 'function' ) props.push( name );
            } );
            return props;
        }
    }.property( 'model.model' ),

    actions: {

        toggleEdit: function(){
            this.toggleProperty( 'isEditing' );
            this.get( 'model' ).rollback();
        },
        goBack: function(){
            this.set( 'model.ruleObj', JSON.parse( this.get( 'model.rule' ) ) );
            this.setProperties( {
                hasErrors: false,
                validated: false,
                isEditing: false
            } );
            return true;
        },
        addField: function(){
            this.get( 'model.ruleObj' ).pushObject( { name: "", match_type: "", value: "", errors: { name: [], match_type: [], value: [] } } );
        },
        deleteField: function( obj ){
            this.get( 'model.ruleObj' ).removeObject( obj );
        },
        activate: function(){
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberMonRules/' + this.get( 'model.id' ) + '/activate',
                    type: 'POST',
                    dataType: 'json'
                } ).then(
                    function( res ){
                        this.store.push( 'uber-mon-rule', res.uberMonRule );
                        this.notify.success( 'Monitoring Rule has been Activated', { closeAfter: 5000 } );
                        this.transitionToRoute( 'uber-monitoring-rules.index' );
                    }.bind( this ),
                    function( xhr ){
                        this.get( 'akxUtil' ).handleError( xhr, {
                            scope: this
                        } );
                    }.bind( this ) );
            }.bind( this ) );
        },
        deactivate: function(){
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberMonRules/' + this.get( 'model.id' ) + '/deactivate',
                    type: 'POST',
                    dataType: 'json'
                } ).then(
                    function( res ){
                        this.store.push( 'uber-mon-rule', res.uberMonRule );
                        this.notify.success( 'Monitoring Rule has been deactivated', { closeAfter: 5000 } );
                        this.transitionToRoute( 'uber-monitoring-rules.index' );
                    }.bind( this ),
                    function( xhr ){
                        this.get( 'akxUtil' ).handleError( xhr, {
                            scope: this
                        } );
                    }.bind( this ) );
            }.bind( this ) );
        },
        updateRule: function(){
            this.set( 'validated', true );
            if( this.get( 'model.ruleObj.length' ) === 0 ){
                this.set( 'hasErrors', true );
                this.notify.warning( 'At least 1 field must be added', { closeAfter: 5000 } );
            }
            this.get( 'model.ruleObj' ).forEach( function( field ){
                if( field.name ){
                    Ember.set( field, 'errors.name', [] ); this.set( 'hasErrors', false );
                }
                else{
                    Ember.set( field, 'errors.name', [ 'Name is required' ] ); this.set( 'hasErrors', true );
                }
                if( field.match_type ){
                    Ember.set( field, 'errors.match_type', [] ); this.set( 'hasErrors', false );
                }
                else{
                    Ember.set( field, 'errors.match_type', [ 'Match Type is required' ] ); this.set( 'hasErrors', true );
                }
                if( field.value ){
                    Ember.set( field, 'errors.value', [] ); this.set( 'hasErrors', false );
                }
                else{
                    Ember.set( field, 'errors.value', [ 'Value is required' ] ); this.set( 'hasErrors', true );
                }
            }.bind( this ) );
            if( !this.get( 'hasErrors' ) ){
                this.set( 'isEditing', false );
                this.get( 'model.ruleObj' ).forEach( function( field ){
                    delete field.errors;
                } );
                this.set( 'model.rule', JSON.stringify( this.get( 'model.ruleObj' ) ) );
                this.validate().then( function(){
                    this.get( 'model' ).save().then( function(){
                        var route = this.container.lookup( 'route:uber-monitoring-rules.index' );
                        route.refresh();
                        this.transitionToRoute( 'uber-monitoring-rules.index' );
                    }.bind( this ) ).catch( function( xhr ){
                        this.get( 'model' ).rollback();
                        this.get( 'akxUtil' ).handleError( xhr, {
                            scope: this
                        } );
                    }.bind( this ) );
                }.bind( this ) );
            }
        }
    }
} );