import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Component.extend( {


    from_date: null,
    to_date: null,

    tagName: 'div',
    classNames: [ 'map-canvas' ],

    init: function(){
    },

    getMarkers: function( map ){
        var self = this;
        Ember.$.ajax( {
            url: config.APP.uber_api_host + '/analytics/ip-map?from_date=' + self.get( 'from_date' ) + '&to_date=' + self.get( 'to_date' ),
            type: 'GET'
        } ).then(
            function( response ){
                var markers = [];
                if( response.data !== null ){
                    for( var i = 0; i < response.data[ 0 ].data.length; i++ ){

                        var string = response.data[0].data[i].users;
                        var result = string.replace(",", '<div>');

                        var latLng = new google.maps.LatLng( response.data[ 0 ].data[ i ].latitude, response.data[ 0 ].data[ i ].longitude );
                        var marker = new google.maps.Marker( {
                            position: latLng,
                            html: result
                        } );
                        markers.push( marker );
                    }
                    var infowindow = new google.maps.InfoWindow( {
                        content: ""
                    } );
                    for( i = 0; i < markers.length; i++ ){
                        google.maps.event.addListener( markers[ i ], 'click', function(){
                            infowindow.setContent( this.html );
                            infowindow.open( map, this );
                        } );
                    }
                    var markerCluster = new MarkerClusterer( map, markers, {
                        imagePath: 'https://raw.githubusercontent.com/googlemaps/js-marker-clusterer/gh-pages/images/m',
                        maxZoom: 8
                    } );
                }
            }
        );
    },

    didInsertElement: function(){
        var self = this;
        Ember.run.scheduleOnce( 'afterRender', function(){
            Ember.$.getScript( 'https://maps.googleapis.com/maps/api/js?key=' + config.googleMaps.apiKey, function( data, textStatus, jqxhr ){
                var map = new google.maps.Map( document.getElementsByClassName( 'map-canvas' )[ 0 ], {
                    center: { lat: 0, lng: 0 },
                    zoom: 3
                } );
                self.getMarkers( map );
            } );
        } );
    },

    watchDate: function(){
        this.init();
    }.observes( 'from_date', 'to_date' )

} );

