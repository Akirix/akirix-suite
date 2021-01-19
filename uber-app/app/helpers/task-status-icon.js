import Ember from 'ember';

export function taskStatusIcon( number ){
    var icon = '';
    switch( number ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="New"><i class="text-gray-light fa fa-lightbulb-o fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="In Progress"><i class="text-blue fa fa-rocket fa-fw"></i></span>';
            break;
        case 2:
            icon = '<span class="hint--left hint--rounded" data-hint="Completed"><i class="text-green-dark fa fa-check-circle fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
}

export default Ember.Handlebars.makeBoundHelper( taskStatusIcon );