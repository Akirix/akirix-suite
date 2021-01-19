import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        'accountAlias.wire_instruction_id': {
            presence: true
        },
        'accountAlias.name': {
            presence: true
        }
    },

    canAddPAN: function(){
        return Ember.isEmpty( this.get( 'model.accountAliases' ) );
    }.property( 'model.accountAliases.@each' ),
    
    canActivate: function(){
        return this.get( 'noInstructionNedeed' ) || !this.get( 'canAddPAN' );
    }.property( 'canAddPAN', 'noInstructionNedeed' ),

    actions: {
        createAccountAlias: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var accountAlias = self.get( 'accountAlias' );
                    accountAlias.model = 'node';
                    accountAlias.model_id = self.get( 'endBuyerNode.id' );
                    accountAlias.company_id = self.get( 'endBuyerNode.company_id' );
                    accountAlias.account_id = self.get( 'endBuyerNode.account_id' );
                    accountAlias.notes = 'P-' + self.get( 'model.project.name' );

                    var newAlias = self.store.createRecord( 'account-alias', accountAlias );

                    newAlias.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:projects.index.view' );
                            self.notify.success( 'New Preferred Account created successfully.', { closeAfter: 5000 } );
                            route.refresh();
                        },

                        function( xhr ){
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );

                },
                function(){

                } );
        },
        activate: function(){
            var self = this;

            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/projects/' + this.get( 'model.project.id' ) + ' /activate',
                type: 'POST'
            } ).then(
                function(){
                    self.get( 'model.project' ).reload();
                    self.notify.success( 'Project P-' + self.get( 'model.project.name' ) + 'is now active', { closeAfter: 5000 } );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }
    }
} );