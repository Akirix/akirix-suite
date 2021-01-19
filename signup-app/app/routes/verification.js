import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    activate: function(){
        var _this = this;
        document.title = config.APP.company.name + " | Verification";
        Ember.run.scheduleOnce( 'afterRender', _this, function(){
            _this._processDocumentTypes().then( function(){
                _this.send( 'focusDocumentType' );
            } );
        } );
    },

    model: function(){
        var _this = this;
        var registration = this.modelFor( 'application' );
        var accountType = registration.get( 'account_type' );

        return this.get( 'akxAdapter' ).sendRequest( '/document-types' ).then( function( result ){
            var model = result.data.filter( function( documentType ){
                var accountTypes = Ember.get( documentType, 'account_type' );
                return accountTypes.contains( accountType );
            } );

            model = model.sortBy( 'order' );

            return Ember.RSVP.resolve( model );
        } );
    },

    afterModel: function( resolvedModel, transition, queryParams ){
        var _this = this;
        var registration = this.modelFor( 'application' );
        var routeMap = this.controllerFor( 'verification' ).get( 'routeMap' );
        var accountType = registration.get( 'account_type' );
        var verificationController = this.controllerFor( 'verification' );

        if( registration.company.country === 'US' || registration.company.country === 'NZ' ){
            resolvedModel.removeObject( resolvedModel.findBy( 'name', 'w8_ben' ) );
            resolvedModel.removeObject( resolvedModel.findBy( 'name', 'w8_ben_e' ) );
        }
        else{
            // Non US Companies
            var taxDocument = resolvedModel.findBy( 'name', 'tax_identity' );

            if( accountType === 'personal' ){
                resolvedModel.removeObject( taxDocument );
                resolvedModel.removeObject( resolvedModel.findBy( 'name', 'w8_ben_e' ) );
            }
            else{
                Ember.set( taxDocument, 'exemptible', true );
            }
        }

        var ownerDocument = resolvedModel.findBy( 'name', 'owner_id' );
        resolvedModel.removeObject( ownerDocument );
        registration.owners.forEach( function( owner, idx ){
            var newOwnerDoc = JSON.parse( JSON.stringify( ownerDocument ) );
            newOwnerDoc.name = newOwnerDoc.name + '_' + idx;
            newOwnerDoc.display_name = owner.name + ' ID';
            newOwnerDoc.uid = idx;
            verificationController.get( 'routeMap' )[ newOwnerDoc.name ] = 'owner-id';
            resolvedModel.pushObject( newOwnerDoc );
        } );


        resolvedModel.forEach( function( documentType ){
            var route = 'verification.' + routeMap[ documentType.name ];
            Ember.set( documentType, 'route', route );
        } );
    },

    _processDocumentTypes: function(){
        var _this = this;
        var verificationController = this.controllerFor( 'verification' );

        return new Ember.RSVP.Promise( function( resolve, reject ){
            _this.modelFor( 'verification' ).forEach( function( documentType ){
                var documents = verificationController.get( 'registration.documents' ).filter( function( item, index, enumerable ){
                    return item.document_type === documentType.name && item.status === 1;
                } );
                Ember.set( documentType, 'complete', !Ember.isEmpty( documents ) );
            } );

            resolve();
        } );
    },

    _getNextDocumentType: function(){
        var _this = this;
        Ember.run.sync();
        return new Ember.RSVP.Promise( function( resolve, reject ){
            var verificationController = _this.controllerFor( 'verification' );
            var routeMap = verificationController.get( 'routeMap' );
            var documentTypes = _this.modelFor( 'verification' );
            var documents = _this.modelFor( 'application' ).get( 'documents' );

            if( Ember.isEmpty( documentTypes ) ){
                reject( new Error( 'Cannot find documentTypes' ) );
            }
            else{
                var missingDocumentType = documentTypes.findBy( 'complete', false );
                if( Ember.isEmpty( missingDocumentType ) ){
                    var destinationDocumentType = documentTypes.get( 'lastObject' );
                    if( !Ember.isEmpty( routeMap[ destinationDocumentType.name ] ) ){
                        let result = {
                            route: 'verification.' + routeMap[ destinationDocumentType.name ],
                            documentTypeName: destinationDocumentType.name,
                            uid: destinationDocumentType.uid
                        };
                        resolve( result );
                    }
                }
                else{
                    let result = {
                        route: 'verification.' + routeMap[ missingDocumentType.name ],
                        documentTypeName: missingDocumentType.name,
                        uid: missingDocumentType.uid
                    };
                    resolve( result );
                }
            }
        } );
    },

    actions: {
        refreshVerification: function(){
            var _this = this;
            this.refresh().promise
                .then( function(){
                    _this.activate();
                } )
                .catch( function( err ){
                    Ember.Logger.log( err );
                } );
        },

        completeStep: function(){
            Ember.Logger.log( 'verification completeStep' );

            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = this.modelFor( 'application' );

            adapter.sendRequest( '/registrations/' + registration._id, 'put', { registration: registration } )
                .then( function( result ){
                    registration.completeStep( 'verification' );
                    return adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } );
                } )
                .then( function( result ){
                    _this.transitionTo( registration.get( 'nextStep' ) );
                } )
                .catch( function(){
                    _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                } );
        },

        // Called when a user clicks continue on the verification
        nextStep: function(){
            var _this = this;

            _this._processDocumentTypes().then( function(){
                var documentTypes = _this.modelFor( 'verification' );
                var missingDocumentType = documentTypes.findBy( 'complete', false );
                if( Ember.isEmpty( missingDocumentType ) ){
                    _this.send( 'completeStep' );
                }
                else{
                    _this.send( 'focusDocumentType' );
                }
            } );
        },

        focusDocumentType: function(){
            var _this = this;

            this._getNextDocumentType()
                .then( function( result ){
                    _this.transitionTo( result.route, { queryParams: { documentTypeName: result.documentTypeName, uid: result.uid } } );
                }, function( err ){
                    _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                } );
        },

        processDocumentTypes: function(){
            var _this = this;
            this._processDocumentTypes();
        }
    }
} );
