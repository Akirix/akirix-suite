import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    fieldsArr: [ { name: "", match_type: "", value: "", errors: { name: [], match_type: [], value: [] } } ],
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
        goBack: function(){
            this.get( 'model' ).deleteRecord();
            this.setProperties( {
                fieldsArr: [ { name: "", match_type: "", value: "", errors: { name: [], match_type: [], value: [] } } ],
                hasErrors: false,
                validated: false
            } );
            return true;
        },
        addField: function(){
            this.get( 'fieldsArr' ).pushObject( { name: "", match_type: "", value: "", errors: { name: [], match_type: [], value: [] } } );
        },
        deleteField: function( obj ){
            this.get( 'fieldsArr' ).removeObject( obj );
        },
        createRule: function(){
            this.set( 'validated', true );
            if( this.get( 'fieldsArr.length' ) === 0 ){
                this.set( 'hasErrors', true );
                this.notify.warning( 'At least 1 field must be added', { closeAfter: 5000 } );
            }
            this.get( 'fieldsArr' ).forEach( function( field ){
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
                this.get( 'fieldsArr' ).forEach( function( field ){
                    delete field.errors;
                } );
                this.set( 'model.rule', JSON.stringify( this.get( 'fieldsArr' ) ) );
                this.validate().then( function(){
                    this.set( 'isLocked', true );
                    this.get( 'model' ).save().then( function(){
                        this.set( 'isLocked', false );
                        this.set('fieldsArr', Ember.A( [{ name: "", match_type: "", value: "", errors: { name: [], match_type: [], value: [] } }]));
                        var route = this.container.lookup( 'route:uber-monitoring-rules.index' );
                        route.refresh();
                        this.transitionToRoute( 'uber-monitoring-rules.index' );
                    }.bind( this ) ).catch( function( xhr ){
                        this.get( 'model' ).rollback();
                        this.get( 'akxUtil' ).handleError( xhr, {
                            scope: this
                        } );
                        this.set( 'isLocked', false );
                    }.bind( this ) );
                }.bind( this ) );
            }
        }
    }

} );