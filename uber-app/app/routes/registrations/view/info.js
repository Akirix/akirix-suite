import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import AkxUtil from 'uber-app/utils/akx-util';
import signupModel from 'uber-app/models/signup-registration';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return {
            employees: [
                { name: '1 - 5', val: '1 - 5' },
                { name: '6 - 25', val: '6 - 25' },
                { name: '26 - 50', val: '26 - 50' },
                { name: '51 - 100', val: '51 - 100' },
                { name: '100+', val: '100+' }
            ],

            entityTypes: [
                { name: 'Corporation', val: 'Corporation' },
                { name: 'Limited / Partnership', val: 'Limited / Partnership' },
                { name: 'Trust', val: 'Trust' },
                { name: 'Nonprofit', val: 'Nonprofit' },
                { name: 'Individual', val: 'Individual' }
            ],

            idTypes: [
                { key: 'Passport', value: 'Passport' },
                { key: 'SSN/TIN', value: 'Social Security / TIN' },
                { key: 'NID', value: 'National ID' },
                { key: 'Local ID', value: 'Provincial/State ID' }
            ],
            accountTypes: [
                { value: 'personal', key: 'Personal' },
                { value: 'business', key: 'Business' }
            ]
        };
    },
    setupController: function( controller, model ){
        this._super( controller, model );
        controller.set( 'isLocked', false );
    },
    renderTemplate: function( controller, model ){
        this.render( 'registrations.info', {
            into: 'registrations.view',
            outlet: 'registrationPrimary'
        } );
    }
} );

