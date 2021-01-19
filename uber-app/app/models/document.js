import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.Model.extend( {
    company_id: DS.attr(),
    user_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    model: DS.attr(),
    model_id: DS.attr(),
    name: DS.attr(),
    type: DS.attr(),
    status: DS.attr(),

    company: DS.belongsTo( 'company', { async: true } ),
    user: DS.belongsTo( 'user', { async: true } ),

    url_download: function(){
        return config.APP.uber_api_host + '/documents/' + this.get( 'id' ) + '/download';
    }.property( 'id' ),

    url_stream: function(){
        return config.APP.uber_api_host + '/documents/' + this.get( 'id' ) + '/stream';
    }.property( 'id' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_created_at_time: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'created_at' )

} );

