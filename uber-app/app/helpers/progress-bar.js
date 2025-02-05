import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value ){
    var html = '<div class="progress">' +
        '<div class="progress-bar" role="progressbar" aria-valuenow="' + value + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + value + '%;">' +
        value +
        '%</div>' +
        '</div>';
    return new Ember.Handlebars.SafeString( html );
} );