import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'companies/view/info-requests' ],
    modelBinding: 'controllers.companies/view/info-requests.model',

    types: [
        { label: 'Document Request', val: 1 },
        { label: 'Text Input Request', val: 0 },
        { label: 'Agree Terms & Conditions', val: 2 }
    ],

    modelOptions: [
        { label: 'This company', val: 'company' },
        { label: 'A user in this company', val: 'user' }
    ],

    isUser: function(){
        return this.get( 'infoRequest.model' ) === 'user';
    }.property( 'infoRequest.model' ),

    users: function(){
        if( this.get( 'infoRequest.model' ) === 'user' ){
            return this.store.find( 'user', { company_id: this.get( 'company' ).objectAt( 0 ).company_id } );
        }
    }.property( 'isUser' ),

    validations: {
        'infoRequest.type': {
            presence: true
        },
        'infoRequest.deadline': {
            presence: true
        },
        'infoRequest.model': {
            presence: true
        },
        'infoRequest.model_id': {
            presence: true
        },
        'infoRequest.notes': {
            presence: true
        }
    },

    actions: {
        createRequest: function(){
            var self = this;
            this.validate().then( function(){
                self.store.createRecord( 'info-request', self.get( 'infoRequest' ) ).save().then(
                    function( res ){
                        self.notify.success( 'Information Request sent.', { closeAfter: 5000 } );
                        self.get( 'model' ).pushObject( Ember.A( [ res ] ) );
                        self.transitionToRoute( 'companies.view.info-requests' );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        }
    }
} );