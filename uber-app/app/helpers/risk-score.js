import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( riskScore ){

    var icon;
        // Complete / Processed
        if( riskScore < 60 ){
            icon = '<span class="hint--left hint--rounded" data-hint="High Risk"><i class="text-rose fa fa-exclamation-triangle fa-fw"></i> </span>';
        }
        // Hold
        else if( riskScore >= 60 && riskScore < 95 ){
            icon = '<span class="hint--left hint--rounded" data-hint="Medium Risk"><i class="text-yellow fa fa-exclamation-circle fa-fw"></i> </span>';
        }
        // Archived
        else if(riskScore >= 95 ){
            icon = '<span class="hint--left hint--rounded" data-hint="Low Risk"><i class="text-green-dark  fa fa-check-circle fa-fw"></i></span>';
        }

    return new Ember.Handlebars.SafeString( icon );
});