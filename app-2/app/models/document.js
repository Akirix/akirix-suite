import DS from 'ember-data';
import config from 'akx-app/config/environment';

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    model: DS.attr(),
    model_id: DS.attr(),
    name: DS.attr(),
    company_id: DS.attr(),
    type: DS.attr(),
    status: DS.attr(),

    url_download: function(){
        return config.APP.api_host + '/documents/' + this.get( 'id' ) + '/download';
    }.property( 'id' ),

    url_stream: function(){
        return config.APP.api_host + '/documents/' + this.get( 'id' ) + '/stream';
    }.property( 'id' )
} );

