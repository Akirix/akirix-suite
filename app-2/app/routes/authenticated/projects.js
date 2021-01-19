import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Pagination from 'akx-app/mixins/akx-pagination';
import CloseMixin from 'akx-app/mixins/close-side-panel';

export default Ember.Route.extend( StringObjectMixin, CloseMixin, Pagination, {
    activate(){
        document.title = "Projects";
    },
    model(){
        let controller = this.controllerFor( 'authenticated.projects' );
        let searchParams = {
            page: controller.get( 'page' ),
            per_page: controller.get( 'perPage' )
        };
        return Ember.RSVP.hash( {
            projects: this.store.query( 'project', searchParams )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        let promises = [];
        model.projects.forEach( ( project )=>{
            promises.push(
                project.get( 'node' ),
                project.get( 'bnode' ),
                project.get( 'snodes' )
            )
        } );
        return Ember.RSVP.Promise.all( promises );
        // For later api stuff when we add external nodes
        // .then( ()=>{
        //     let morePromises = [];
        //     model.projects.forEach( ( project )=>{
        //         morePromises.push(
        //             project.get( 'node.external_nodes' ),
        //         )
        //     } );
        // } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        controller.set( 'projects', model );
    },

    renderTemplate(){
        this.render( 'projects/index', {
            into: 'authenticated'
        } );
    },

    actions: {
        willTransition( transition ){
            if( transition.targetName === `${this.get('routeName')}.index` ){
                this.refresh();
            }
        },
        refresh(){
            this.refresh();
        }
    }
} );
