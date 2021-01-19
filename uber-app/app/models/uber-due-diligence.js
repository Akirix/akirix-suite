import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.Model.extend( {
    company_id: DS.attr(),
    uber_user_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    options: DS.attr(),
    status: DS.attr(),

    uberUser: DS.belongsTo( 'uber-user', { async: true } ),

    optionsObj: function(){
        return JSON.parse( this.get( 'options' ) );
    }.property( 'options' ),

    str_updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_updated_at_time: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'updated_at' ),

    url_download: function(){
        return config.APP.uber_api_host + '/uberDueDiligences/' + this.get( 'id' ) + '/download';
    }.property( 'id' ),

    isFulfilled: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' )

} );