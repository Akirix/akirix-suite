import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application', 'verification' ],
    registrationBinding: 'controllers.application.content',
    documentTypesBinding: 'controllers.verification.content',
    checkExemption: false,
    exemption_reason: null,

    documentType: function(){
        return this.get( 'documentTypes' ).findBy( 'name', this.get( 'documentTypeName' ) );
    }.property( 'documentTypes', 'documentTypeName' ),

    documents: function(){
        var _this = this;
        return this.get( 'registration.documents' ).filter( function( item, index, enumerable ){
            return item.document_type === _this.get( 'documentTypeName' ) && item.status === 1;
        } );
    }.property( 'registration.documents', 'documentTypeName' ),

    stepComplete: function(){
        return this._stepComplete();
    }.property( 'documents' ),

    hasExemption: function(){
        return this.get( 'documents' ).isAny( 'exemption', true ) || this.get( 'checkExemption' );
    }.property( 'documents', 'checkExemption' ),

    _stepComplete: function(){
        return this.get( 'documents' ).length > 0;
    },

    init: function(){
        this._super();
        var exemption = this.get( 'documents' ).findBy( 'exemption', true );
        if( !Ember.isEmpty( exemption ) ){
            this.set( 'checkExemption', true );
            this.set( 'exemption_reason', exemption.exemption_reason );
        }
    },

    actions: {
        nextStep: function(){
            if( this.get( 'stepComplete' ) ){
                return true;
            }
        }
    }
} );
