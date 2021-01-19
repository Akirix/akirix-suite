import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( document_type_id, documentTypes ){
    if( Array.isArray( documentTypes ) ){
        var documentType = documentTypes.findBy( 'name', document_type_id );

        if( !Ember.isEmpty( documentType ) ){
            var icon = Ember.get( documentType, 'icon' );
            var displayName = Ember.get( documentType, 'display_name' );
            return new Ember.Handlebars.SafeString( '<i class="' + icon + ' fa-fw"></i>&nbsp;' + displayName );
        }
    }
} );