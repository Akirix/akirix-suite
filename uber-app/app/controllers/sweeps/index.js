import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( {

    needs: [ 'application' ],

    actions: {

        sweepAccounts: function(){
            var self = this;
            var promises = Ember.A();
            var model = this.get( 'model' );

            for( var i = 0; i < model.length; i++ ){
                for( var j = 0; j < model[ i ].fromAccounts.length; j++ ){
                    if( model[ i ].fromAccounts[ j ].isChecked != false ){
                        var account_id = model[ i ].fromAccounts[ j ].id;
                        var payload = {
                            amount: this.get( 'model.' + i + '.fromAccounts.' + j + '.balance' ),
                            to_account_id: model[ i ].toAccount.id
                        };
                        if( payload.amount > 0 ){
                            promises.push(
                                Ember.run( function(){
                                    return Ember.$.ajax( {
                                        url: config.APP.uber_api_host + '/accounts/' + account_id + '/transfer',
                                        type: 'POST',
                                        contentType: "application/json; charset=utf-8",
                                        dataType: 'json',
                                        data: JSON.stringify( { data: payload } )
                                    } );
                                } )
                            );
                        }
                    }
                }
            }
            Ember.RSVP.Promise.all( promises ).then( function( response ){
                    self.notify.success( 'The account transaction sent successfully.', { closeAfter: 5000 } );
                    for( var i = 0; i < model.length; i++ ){
                        for( var j = 0; j < model[ i ].fromAccounts.length; j++ ){
                            if( model[ i ].fromAccounts[ j ].isChecked != false ){
                                model[ i ].fromAccounts[ j ].reload();
                            }
                        }
                    }
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        }
    }


} );
