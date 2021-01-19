import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],
    typesOfInfoRequests: Ember.A( [
        { label: 'Text', val: 0 },
        { label: 'document', val: 1 },
        { label: 'Terms & Conditions', val: 2 }
    ] ),
    modelOptions: [
        { label: 'This company', val: 'company' },
        { label: 'A user in this company', val: 'user' }
    ],

    isUser: function(){
        return this.get( 'info-req.model' ) === 'user';
    }.property( 'info-req.model' ),

    users: function(){
        if( this.get( 'info-req.model' ) === 'user' ){
            return this.store.find( 'user', { company_id: this.get( 'company' ).objectAt( 0 ).company_id } );
        }
    }.property( 'isUser' ),

    companyName: function(){
        return this.get( 'company' ).objectAt( 0 ).companyName;
    }.property( 'company' ),

    token: function(){
        return this.get( 'session.access_token' )
    }.property(),

    getDocuments: function(){
        if( this.get( 'info-req' ).get('isDocument') ){
            var self = this;
            this.store.find( 'document', { model_id: this.get( 'info-req' ).get( 'id' ) } ).then( function( docs ){
                self.set( 'documents', docs  );
            } );
        }
    }.observes( 'info-req.isDocument' ),

    validations: {
        'info-req.type': {
            presence: true
        },
        'info-req.deadline': {
            presence: true
        },
        'info-req.model': {
            presence: true
        },
        'info-req.model_id': {
            presence: true
        },
        'info-req.notes': {
            presence: true
        }
    },

    actions: {
        update: function(){
            var self = this;
            this.validate().then( function(){
                self.get( 'info-req' ).save().then(
                    function(){
                        self.transitionToRoute( 'companies.view.info-requests' );
                        self.notify.success( 'Info Request updated.', { closeAfter: 5000 } );
                    },
                    function( xhr ){
                        self.get( 'controller' ).get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        },

        open: function( id ){
            var self = this;
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/infoRequests/' + id + '/open',
                    type: 'POST',
                    dataType: 'json',
                    data: {}
                } ).then(
                    function( res ){
                        self.store.push( 'info-request', self.store.normalize( 'info-request', res.infoRequest) );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                        self.set( 'isLocked', false );
                    }
                );
            } );
        },

        close: function( id ){
            var self = this;
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/infoRequests/' + id + '/close',
                    type: 'POST',
                    dataType: 'json',
                    data: {}
                } ).then(
                    function( res ){
                        self.store.push( 'info-request', self.store.normalize( 'info-request', res.infoRequest) );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                        self.set( 'isLocked', false );
                    }
                );
            } );
        }
    }
} );