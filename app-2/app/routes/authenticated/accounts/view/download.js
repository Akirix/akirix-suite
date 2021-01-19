import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import downloadValidations from 'akx-app/validations/download';

export default Ember.Route.extend( StringObjectMixin, {
    model(){
        return { file_type: '', period_from: '', period_to: '' };
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let changeset = new Changeset( model, lookupValidator( downloadValidations ), downloadValidations );
        controller.setProperties( {
            changeset: changeset,
            fileTypes: [ { label: 'CSV', val: 'csv' } ]
        } );
        this.send( 'openSidePanel', 'accounts/download', '', controller );
    }
} );
