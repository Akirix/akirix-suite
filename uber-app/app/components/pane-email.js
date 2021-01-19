import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
import _ from 'lodash/lodash';

export default Ember.Component.extend( EmberValidations.Mixin, {
    globalPaneArray: null,
    item: null,
    itm: null,
    store: Ember.inject.service(),
    validations: {
        'item.subject': {
            presence: true
        },
        'item.email': {
            presence: true
        },
        'item.toEmails': {
            length: { minimum: 1, messages: { tooShort: 'needs to have at least one email as recipient' } }
        },
        'item.content': {
            presence: true
        }
    },

    init: function(){
        this._super();
        var self = this;
        Ember.RSVP.hash( {
            templatesWithModel: this.store.find( 'uber-email-template', { model: this.get( 'item.model' ) } ),
            templatesWithoutModel: this.store.find( 'uber-email-template', { model: 'null' } )
        } ).then( function( templateHash ){
            var tempA = Ember.A();
            tempA.pushObjects( templateHash.templatesWithModel.toArray() );
            tempA.pushObjects( templateHash.templatesWithoutModel.toArray() );
            Ember.set( self, 'templates', tempA );
        } );
        this.set( 'templateSelected', null );
        this.set( 'fromEmail', null );
        this.set( 'item.toEmails', Ember.A() );
        this.set( 'item.email', null );
        this.set( 'item.subject', null );
        this.set( 'item.content', null );
        this.set( 'minMaxClass', 'in' );
        this.set( 'minMaxIcon', 'fa-window-minimize' );
        this.set( 'newPerson', {
            name: null,
            email: null
        } );
        this.set( 'attachIdx', null );
    },

    didInsertElement: function(){
        this._super();
        var self = this;
        this.set( 'globalPaneArray', Ember.get( this, 'globalPaneArray' ) );
        this.set( 'attachIdx', Ember.get( this, 'globalPaneArray' ).indexOf( Ember.get( this, 'item' ) ) );
    },

    actions: {
        removeFromGlobalPane: function( item ){
            this.get( 'globalPaneArray' ).removeObject( item );
            if( item.get( 'isNew' ) ){
                item.transitionTo( 'deleted.saved' );
            }
        },
        toggleMinMax: function(){
            if( this.get( 'minMaxClass' ) === 'in' ){
                this.set( 'minMaxClass', '' );
                this.set( 'minMaxIcon', 'fa-window-maximize' );
            }
            else{
                this.set( 'minMaxClass', 'in' );
                this.set( 'minMaxIcon', 'fa-window-minimize' );
            }
        },
        setAutoComplete: function( template ){
            Ember.set( this, 'item.subject', Ember.get( template, 'subject' ) );
            Ember.set( this, 'item.content', Ember.get( template, 'content' ) );
            Ember.set( this, 'item.email', Ember.get( template, 'email' ) );
        },
        sendEmail: function(){
            var self = this;
            self.validate().then(
                function(){
                    var convertor = new showdown.Converter( {
                        simplifiedAutoLink: true,
                        excludeTrailingPunctuationFromURLs: true,
                        simpleLineBreaks: true,
                        smoothLivePreview: true
                    } );
                    var payload = {
                        template_name: 'akx-generic',
                        sender: {
                            email: self.get( 'item.email' ),
                            name: self.get( 'item.name' ) || ""
                        },
                        recipients: self.get( 'item.toEmails' ).concat( [ { email: self.get( 'item.email' ), type: 'bcc' } ] ),
                        data: {
                            subject: self.get( 'item.subject' ),
                            body: convertor.makeHtml( self.get( 'item.content' ) )
                        }
                    };
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/info/sendEmail',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        type: 'POST',
                        data: JSON.stringify( payload )
                    } ).then(
                        function( response ){
                            self.set( 'isLocked', false );
                            self.notify.success( 'Email has been sent successfully', { closeAfter: 5000 } );
                            var ubuid = JSON.parse( Ember.get( self, 'session.content.user_data' ) );
                            var noteContent = "From: " + self.get( 'item.email' ) + "\n";
                            noteContent += "To: " + Ember.get( self, 'item.toEmails' ).map( function( val ){
                                    return val.name + '<' + val.email + '>';
                                } ).join( ',' ) + "\n\n";
                            noteContent += Ember.get( self, 'item.content' );


                            var newItem = self.get( 'store' ).createRecord( 'uberTask', {
                                type: 1,
                                model: Ember.get( self, 'item.model' ),
                                model_id: Ember.get( self, 'item.model_id' ),
                                company_id: Ember.get( self, 'item.company_id' ),
                                due_date: moment().add( 1, 'days' ).format( 'YYYY-MM-DD hh:mm:ss' ),
                                notes: noteContent,
                                title: '[E-mail] ' + Ember.get( self, 'item.subject' ),
                                priority: 1,
                                sentiment: 1,
                                status: 1,
                                uber_user_id: ubuid.id
                            } );

                            newItem.save().then(
                                function(){
                                    self.set( 'isLocked', false );
                                    self.notify.success( 'Created Task', { closeAfter: 5000 } );
                                    self.send( 'removeFromGlobalPane', self.get( 'item' ) );
                                },
                                function( xhr ){
                                    self.get( 'akxUtil' ).handleError( xhr, {
                                        scope: self
                                    } );
                                }
                            );
                        },
                        function( xhr, status, error ){
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
                },
                function( err ){
                }
            );
        },
        addPerson: function( newPerson ){
            if( !Ember.isEmpty( newPerson.email ) ){
                this.get( 'item.toEmails' ).pushObject( Ember.Object.create( {
                    email: newPerson.email,
                    name: newPerson.name || "",
                    type: 'to'
                } ) );
                this.set( 'newPerson', { name: null, email: null } );
            }
        },
        removePerson: function( person ){
            this.get( 'item.toEmails' ).removeObject( person );
        }
    }
} );

