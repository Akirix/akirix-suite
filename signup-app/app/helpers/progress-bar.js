import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( progress ){
    var html =
        '<div class="progress">' +
        '<div class="progress-bar" role="progressbar" aria-valuenow="' + progress + '" aria-valuemin="0" aria-valuemax="100" style="width:' + progress + '\;"></div>' +
        '</div>';

    return new Ember.Handlebars.SafeString( html );
} );

