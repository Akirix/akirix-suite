import DS from 'ember-data';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {

    uber_user_id: DS.attr(),
    company_id: DS.attr(),
    created_at: DS.attr(),
    updated_at: DS.attr(),

    raw_data: DS.attr(),
    status: DS.attr( 'number' ),
    notes: DS.attr(),

    name: DS.attr(),

    uberUser: DS.belongsTo( 'uber-user', { async: true } ),

    str_updated_at: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_created_at: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    dataObj: function(){
        if( this.get( 'raw_data' ) !== undefined ){
            return JSON.parse( this.get( 'raw_data' ) );
        }
        else{
            return null;
        }
    }.property( 'raw_data' ),

    url_pdf: function(){
        return config.APP.uber_api_host + '/uberSarReports/' + this.get( 'id' ) + '/pdf';
    }.property( 'id' ),

    url_fincen: function(){
        return config.APP.uber_api_host + '/uberSarReports/' + this.get( 'id' ) + '/downloadFinCEN';
    }.property( 'id' ),

    url_goAml: function(){
        return config.APP.uber_api_host + '/uberSarReports/' + this.get( 'id' ) + '/downloadgoAML';
    }.property( 'id' ),
} );
