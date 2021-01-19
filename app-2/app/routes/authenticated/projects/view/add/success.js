import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    queryParams: {
        account_id: { refreshModel: true },
        project_id: { refreshModel: true },
        contract_type: { refreshModel: true }
    },

    model( params ){
        return Ember.RSVP.hash( {
            project: this.store.findRecord( 'project', params.project_id ),
            account: this.store.findRecord( 'account', params.account_id ),
            documents: this.store.query( 'document', { model: 'project', model_id: params.project_id } ),
            contract_type: params.contract_type
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        return Ember.RSVP.Promise.resolve( model.project.get( 'node' ) );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let stringList = controller.get( 'stringList' );
        
        controller.setProperties( {
            success: true,
            contractType: model.contract_type === '1' ?
                stringList.customContract :
                stringList.akirixStandardContract
        } );
    },

    renderTemplate( controller ){
        this.send(
            'openSidePanel',
            'projects/success',
            'projects/view/side-navs/project-add-success',
            controller,
            true
        );
    },

    actions: {
        closeSidePanel(){
            let model = this.modelFor( this.routeName );
            let sidePanel = Ember.$( '#sidePanel' );
            sidePanel.animate( {
                right: `-${sidePanel.width()+20}px`
            }, 500, ()=>{
                this.transitionTo( 'authenticated.projects.view', model.project.id );
                this.disconnectOutlet( {
                    parentView: 'application',
                    outlet: 'side-panel'
                } );
            } );
        }
    }
} );
