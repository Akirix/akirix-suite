import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( status ){
    var html;

    // Complete / Processed
    if( status === 1 || status === 2 ){
        html = '<i class="fa fa-star text-yellow">';
    }
    // Hold
    else if( status === 3 ){
        html = '<i class="fa fa-flag-o text-info"></i>';
    }
    // Archived
    else if( status === 4 ){
        html = '<i class="fa fa-archive text-muted"></i>';
    }
    else{
        html = '<i class="fa fa-star-o"></i>';
    }

    return new Ember.Handlebars.SafeString( html );
} );
