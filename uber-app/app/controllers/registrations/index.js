import Ember from 'ember';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( {

    queryParams: [ 'status', 'institution' ],
    status: 5,
    int_id: 0,
    int_go: false,

    regStatusUpdated: function(){
        this.refreshRegs();
    }.observes( 'status', 'institution' ),

    refreshRegs: function(){
        var self = this;
        Ember.$.ajax( {
            url: config.APP.uber_api_host + '/signupRegistrations?status=' + self.get( 'status' ) + '&institution=' + self.get( 'institution' ),
            type: 'GET'
        } ).then(
            function( response ){
                var regs = Ember.A();
                response.registrations.forEach( function( item ){
                    item.exceptions = self.store.find( 'uber-exception', { model: 'registration', model_id: item._id } );
                    if( item.institution_id ){
                        item.institution = self.store.find( 'company', item.institution_id );
                    }
                    regs.push( signupModel.create( item ) );
                } );

                self.set( 'model', regs );
            },
            function( xhr ){
                AkxUtil.handleError( xhr, {
                    scope: this
                } );
            }
        );
    },

    actions: {
        refreshRegs: function(){
            this.refreshRegs();
        }

    }

} );
