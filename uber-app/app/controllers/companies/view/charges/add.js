import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],
    account: null,

    validations: {
        'model.amount': {
            presence: true,
            numericality: {
                greaterThan: 0
            }
        },
        'model.type': {
            presence: true
        },
        'model.account_id': {
            presence: true
        },
        'model.start_date': {
            presence: true
        },
        'model.title': {
            presence: true
        },
        'model.frequency': {
            presence: true
        },
        'model.frequency_type': {
            presence: true
        }
    },

    typeSelected: function(){
        return this.get( 'model.type' ) !== null;
    }.property( 'model.type' ),

    isRecurring: function(){
        return this.get( 'model.type' ) === 1;
    }.property( 'model.type' ),

    actions: {
        createCharge: function(){
            var self = this;
            if( self.get( 'model.type' ) === 0 ){
                self.set( 'model.frequency', 0 );
                self.set( 'model.frequency_type', 'day' );
            }
            this.validate().then( function(){
                var newCharge = self.store.createRecord( 'charge', {
                    amount: self.get( 'model.amount' ),
                    account_id: self.get( 'model.account_id' ),
                    company_id: self.get( 'model.company_id' ),
                    start_date: new Date( self.get( 'model.start_date' ) ),
                    title: self.get( 'model.title' ),
                    frequency: self.get( 'model.frequency' ),
                    frequency_type: self.get( 'model.frequency_type' ),
                    type: self.get( 'model.type' ),
                    notes: self.get( 'model.notes' )
                } );

                self.set( 'isLocked', true );
                newCharge.save().then(
                    function(){
                        self.set( 'isLocked', false );
                        self.notify.success( 'New fee charge created', { closeAfter: 5000 } );
                        var route = self.container.lookup( 'route:companies.view.charges' );
                        self.transitionToRoute( 'companies.view.charges' );
                        route.refresh();
                    },
                    function( xhr ){
                        self.get( 'isLocked', false );
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            }, function(){
            } );
        }
    }


} );

