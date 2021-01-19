import Ember from 'ember';
import defaultVerificationController from 'signup-app/controllers/verification/default';

export default defaultVerificationController.extend( {
    documentTypeName: 'proof_of_address'
} );