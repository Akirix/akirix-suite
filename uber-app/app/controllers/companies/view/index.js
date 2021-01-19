import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    period_from: moment( new Date( new Date().getFullYear(), new Date().getMonth(), 1 ) ).subtract( 365, 'days' ).format( 'YYYY-MM-01' ),
    period_to: moment( new Date( new Date().getFullYear(), new Date().getMonth() + 1, 0 ) ).format( 'YYYY-MM-DD' ),
    plot_from: moment( new Date( new Date().getFullYear(), new Date().getMonth(), 1 ) ).subtract( 365, 'days' ).format( 'YYYY-MM-01' ),
    plot_to: moment( new Date( new Date().getFullYear(), new Date().getMonth() + 1, 0 ) ).format( 'YYYY-MM-DD' ),

    companyStatusUpdated: function(){
        return this.get( 'company.status' ) !== this.get( 'originalCompanyStatus' );
    }.property( 'company.status', 'originalCompanyStatus' ),

    noteTitle: function(){
        switch( this.get( 'company.status' ) ){
            case 0:
                return "Account Closed";
            case 1:
                return 'Account Activated';
            case 2:
                return 'Account Suspended';
        }
    }.property( 'company.status' ),

    statusLabels: [
        {
            label: 'Active',
            value: 1
        },
        {
            label: 'Suspended',
            value: 2
        },
        {
            label: 'Closed',
            value: 0
        }
    ],

    validations: {
        "company.name": {
            presence: true
        },
        "company.status": {
            presence: true
        },
        "company.email": {
            format: {
                with: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                allowBlank: true,
                message: 'Please enter a valid email'
            }
        },
        "statusChangeNotes": {
            presence: {
                'if': function( obj ){
                    return obj.get( 'companyStatusUpdated' );
                }
            }

        }
    },

    actions: {
        updateCompany: function(){
            var self = this;

            self.validate().then( function(){
                if( self.get( 'company.affiliate' ) === true ){
                    self.set( 'company.affiliate', 1 );
                }
                if( self.get( 'company.affiliate' ) === false ){
                    self.set( 'company.affiliate', 0 );
                }

                if( self.get( 'company.status' ) !== self.get( 'originalCompanyStatus' ) ){
                    var endpoint;
                    if( self.get( 'company.status' ) === 2 ){
                        endpoint = 'suspend'
                    }
                    else if( self.get( 'company.status' ) === 1 ){
                        endpoint = 'activate'
                    }
                    else if( self.get( 'company.status' ) === 0 ){
                        endpoint = 'close'
                    }
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/companies/' + self.get( 'company.id' ) + '/' + endpoint,
                        type: 'POST'
                    } ).then( function(){
                        var statusChangeNotes = self.get( 'store' ).createRecord( 'uberTask', {
                            type: 1,
                            model: 'Company',
                            model_id: Ember.get( self, 'company.id' ),
                            company_id: Ember.get( self, 'company.id' ),
                            due_date: moment().utc().format( 'YYYY-MM-DD hh:mm:ss' ),
                            notes: self.get( 'statusChangeNotes' ),
                            title: self.get( 'noteTitle' ),
                            priority: 1,
                            sentiment: 1,
                            status: 1
                        } );
                        return statusChangeNotes.save();
                    }, function( xhr, status, error ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } ).then( function(){
                        return self.get( 'company' ).save();
                    }, function( xhr, status, error ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } ).then( function( res ){
                        self.notify.info( 'Updated' );
                        self.set( 'statusChangeNotes', null );
                        self.set( 'originalCompanyStatus', self.get( 'company.status' ) );
                        // self.set( 'model', self.store.normalize( 'company', self.store.normalize( 'company', res.company ) ) );
                        self.transitionToRoute( 'companies' );
                    }, function( xhr, status, error ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );

                }
                else{
                    self.get( 'company' ).save().then( function(){
                        self.set( 'isLocked', false );
                        self.notify.info( 'Updated' );
                        var route = self.container.lookup( 'route:companies.view.index' );
                        route.refresh();
                        self.set( 'statusChangeNotes', null );
                        self.set( 'originalCompanyStatus', self.get( 'company.status' ) );
                    }, function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
                }
            }, function( errors ){
                self.set( 'isLocked', false );

            } );
        },

        plot: function(){
            this.set( 'plot_from', this.get( 'period_from' ) + ' 00:00:00' );
            this.set( 'plot_to', this.get( 'period_to' ) + ' 23:59:59' );
        }
    }
} );
