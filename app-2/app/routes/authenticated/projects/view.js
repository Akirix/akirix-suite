import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    notify: Ember.inject.service(),

    model( params ){
        if ( params.project_id === 'newProject' ) {
            return null;
        }
        return Ember.RSVP.hash( {
            project: this.store.findRecord( 'project', params.project_id )
        } );
    },
    afterModel( model ){
        this._super( ...arguments );
        if ( !Ember.isEmpty( model ) ) {
            let promises = [
                model.project.get( 'node' ),
                model.project.get( 'bnode' ),
                model.project.get( 'snodes' ),
            ];
            Ember.RSVP.Promise.all( promises ).then( () => {
                model[ 'externalNodes' ] = this.store.query( 'external-node', { node_id: model.project.get( 'node.id' ) } );
            } );
        }
    },
    setupController( controller, model ){
        this._super( ...arguments );
        if ( Ember.isEmpty( model ) ) {
            controller.setProperties( {
                success: false,
                template: 'projects/add',
            } );
        }
        else{
            const stringList = controller.get( 'stringList' );

            controller.setProperties( {
                externalNodes: model.externalNodes,
                canInvoice: true,
                steps: [
                    {
                        name: 'Finalize your settings',
                        title: Ember.computed( 'project.currentStep', ()=>{
                            if( model.project.get( 'currentStep' ) === 0 ){
                                return stringList.pendingNode;
                            }
                        } ),
                        project: model.project
                    },
                    {
                        name: 'Waiting for others',
                        title: Ember.computed( 'project.currentStep', ()=>{
                            if( model.project.get( 'currentStep' ) === 1 ){
                                return stringList.projectPending
                            }
                        } ),
                        project: model.project
                    },
                    {
                        name: 'Project pending',
                        title: Ember.computed( 'project.currentStep', ()=>{
                            if( model.project.get( 'currentStep' ) === 2 ){
                                return stringList.almostActive
                            }
                        } ),
                        project: model.project
                    }
                ]
            } );

            if( model.project.get( 'isLinear' ) ){
                let snode = model.project.get( 'snodes' ).objectAt( 0 );
                if ( !Ember.isEmpty( snode ) ) {
                    snode.get( 'invoices' ).then( () => {
                        if ( Ember.isEmpty( snode.get( 'invoices' ) ) || snode.get( 'invoices.length' ) !== 1 ) {
                            return controller.set( 'canCreateChildInvoice', false );
                        }
                        return this.get( 'akxUtil' ).authAjax( {
                            type: 'GET'
                        }, `/invoices/${snode.get( 'invoices' ).objectAt( 0 ).id}/can_create_child` );
                    } ).then( ( res ) => {
                        if ( res ) {
                            controller.set( 'canInvoice', res.canCreateChild );
                        }
                    } ).catch( ( err ) => {
                        this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                    } );
                }
            }

            if ( model.project.get( 'isSmart' ) ) {
                controller.set( 'template', 'projects/view-smart' );
            }
            else if ( model.project.get( 'isTree' ) ) {
                controller.set( 'template', 'projects/view-generic' );
            }
            else {
                controller.set( 'template', 'projects/view-linear' );
            }
        }
    },
    renderTemplate( controller ){
        this.render( controller.get( 'template' ), {
            into: 'authenticated'
        } );
    },

    actions: {
        willTransition( transition ){
            if ( transition.targetName === `${this.get( 'routeName' )}.index` ) {
                this.send( 'closeSidePanel', true );
                Ember.$( '.map' ).css( {
                    top: '90px',
                    left: 0
                } );
            }
        },
        activate(){
            const controller = this.controllerFor( this.get( 'routeName' ) );
            const project = controller.get( 'model.project' );
            if( !project.get( 'hasNoBuyer' ) || !project.get( 'hasNoSupplier' ) ){
                this.get( 'akxUtil' ).authAjax( {
                    type: 'POST'
                }, `/nodes/${controller.get( 'model.project.node.id' )}/activate` ).then( () => {
                    controller.get( 'model.project.node' ).reload();
                    controller.get( 'model.project' ).reload();
                    controller.set( 'currentStep', 1 );
                } ).catch( ( err ) => {
                    this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                } );
            }
            else{
                this.get( 'notify' ).error( controller.get( 'stringList.activateError' ), {
                    classNames: [ 'bg-danger' ]
                } );
            }
        }
    }
} );
