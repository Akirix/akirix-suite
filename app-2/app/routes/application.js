import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( ApplicationRouteMixin, StringObjectMixin, {
    intl: Ember.inject.service(),
    notify: Ember.inject.service(),
    activate(){
        document.title = "Akirix Payment System";
    },

    beforeModel() {
        if( !this.get( 'session.isAuthenticated' ) ){
            let lastPart = window.location.href.split( '/' ).pop().split( "?" )[ 0 ];
            if( lastPart !== 'forgot' && lastPart !== 'password-reset' ){
                this.transitionTo( 'login' );
            }
        }
        // Later lazily load translations here intl.addTranslations()
        const langs = navigator.languages;
        this.get( 'intl' ).setLocale( [ 'en-US' ].concat( langs ) );
    },

    setupController(){
        this._super( ...arguments );
        let promises = [
            this.store.findAll( 'currency' ),
            this.store.query( 'location', { status: 1 } ),
            this.store.findAll( 'announcement' )
        ];
        Ember.RSVP.Promise.all( promises ).catch( (  )=>{
            // Not sure what to do here. Not showing Error because it's not important at this time.
            // this.send( 'error', err );
        } );
    },

    renderTemplate(){
        this.render( 'application' );
        this.render( 'confirmation-modal', {
            into: 'application',
            outlet: 'modal'
        } );
    },

    sessionAuthenticated(){
        this.transitionTo( 'authenticated.dashboard' );
        this.send( 'checkInfoRequest' );
    },

    actions: {
        confirmModal(){
            let options = this.controllerFor( 'application' ).get( 'options' );
            options.controller ? options.controller.send( options.action, options.context ) : this.send( options.action, options.context );
        },

        checkInfoRequest(){
            this.store.findAll( 'info-request' ).then( ( infoReq )=>{
                if( !Ember.isEmpty( infoReq ) ){
                    this.send( 'showOverlay', 'info-requests', {
                        infoRequests: infoReq,
                        userName: this.get( 'session.data.authenticated.user.name' ),
                        action: 'closePane'
                    } );
                }
            } );
        },

        showOverlay( template, options ){
            this.controllerFor( 'application' ).setProperties( {
                currentComponent: template,
                options: options,
                action: options.action
            } );
            this.render( 'overlay-pane', {
                into: 'application',
                outlet: 'overpane'
            } );
            Ember.run.scheduleOnce( 'afterRender', function(){
                Ember.$( '#overpane' ).removeClass( 'fadeOutDownBig display-none' ).addClass( 'fadeInUpBig' );
            } );
        },

        closePane( abort ){
            Ember.$( '#overpane' ).removeClass( 'fadeInUpBig' ).addClass( 'fadeOutDownBig' );
            if( abort ){
                this.send( 'goBack' );
            }
        },

        openSidePanel( templatePath, navPath, controller, showOverlay ){
            if( Ember.isEmpty( navPath ) ){
                navPath = 'side-panel-nav-default';
            }
            // Render template into side panel
            this.render( templatePath, {
                into: 'application',
                controller: controller,
                outlet: 'side-panel'
            } );
            this.render( navPath, {
                into: 'application',
                controller: controller,
                outlet: 'side-panel-nav'
            } );
            if( showOverlay ){
                this.render( 'side-panel-overlay', {
                    into: 'application',
                    outlet: 'side-panel-overlay',
                    controller: controller
                } );
            }
            // Open side panel
            Ember.$( '#sidePanel' ).animate( {
                right: 0
            }, 500 );
        },

        closeSidePanel( param ){
            let sidePanel = Ember.$( '#sidePanel' );
            sidePanel.animate( {
                right: `-${sidePanel.width()+20}px`
            }, 500, ()=>{
                if( !param ){
                    this.send( 'goBack' );
                }
                this.disconnectOutlet( {
                    parentView: 'application',
                    outlet: 'side-panel'
                } );
                this.disconnectOutlet( {
                    parentView: 'application',
                    outlet: 'side-panel-overlay'
                } );
            } );
        },

        disconnectSidePanel(){
            this.disconnectOutlet( {
                parentView: 'application',
                outlet: 'side-panel'
            } );
            this.disconnectOutlet( {
                parentView: 'application',
                outlet: 'side-panel-overlay'
            } );
        },

        openErrorModal( template, xhrErrors ){
            const controller = this.controllerFor( this.routeName );
            controller.set( 'errorMessage', controller.get( 'stringList' )[ template ] );
            controller.set( 'xhrErrors', xhrErrors );

            this.disconnectOutlet( {
                parentView: 'application',
                outlet: 'modal'
            } );
            this.render( 'error-modal', {
                into: 'application',
                outlet: 'modal'
            } );
        },

        closeErrorModal(){
            this.disconnectOutlet( {
                parentView: 'application',
                outlet: 'modal'
            } );
            this.render( 'confirmation-modal', {
                into: 'application',
                outlet: 'modal'
            } );
        },

        error( err ){
            if( !Ember.isEmpty( err ) && err.errors ){
                err.errors.forEach( ( e )=>{
                    switch( Number( e.status ) ){
                        case 404:
                        case 403:
                        case 400:
                            this.get( 'notify' ).error( e.errors, {
                                classNames: [ 'bg-danger' ]
                            } );
                            break;
                        case 401:
                            this.get('session').invalidate()
                            break;
                        case 423:
                            this.send( 'checkInfoRequest' );
                            break;
                        case 420:
                            this.send( 'showOverlay', 'authenticate-pane', { action: 'closePane' } );
                            break
                        case 421:
                            this.send( 'showOverlay', 'lock-pane', { message: err.errors.error, action: 'invalidateSession' } );
                            break;
                        case 409:
                            this.send( 'openErrorModal', 'dup-check' );
                            break;
                        case 429:
                            this.send( 'openErrorModal', 'rate-limit' );
                            break;
                        default:
                            this.send( 'openErrorModal', 'error-modal', err.errors );
                    }
                } );
            }
        },

        goBack(){
            var parentRoute = this.get( 'router.currentRouteName' );
            if( parentRoute.substring( parentRoute.lastIndexOf( '.' ) ) === '.index' ){
                parentRoute = parentRoute.substring( 0, parentRoute.lastIndexOf( '.' ) );
            }
            parentRoute = parentRoute.substring( 0, parentRoute.lastIndexOf( '.' ) );
            this.transitionTo( parentRoute );
        }
    }
} );
