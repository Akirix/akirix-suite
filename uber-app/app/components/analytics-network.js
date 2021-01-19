import Ember from 'ember';
import config from 'uber-app/config/environment';


export default Ember.Component.extend( {
    tagName: 'div',
    classNames: [ 'align-center' ],
    from_date: null,
    to_date: null,
    config: {},


    setConfig: function(){
        var clear = d3.select( "#d3chart" );
        clear.selectAll( "*" ).remove();

        var data = this.data;

        var diameter = window.innerHeight - 200,
            radius = diameter / 2,
            innerRadius = radius - 120;

        var cluster = d3.layout.cluster()
            .size( [ 360, innerRadius ] )
            .sort( null );

        var bundle = d3.layout.bundle();

        var line = d3.svg.line.radial()
            .interpolate( "bundle" )
            .tension( .85 )
            .radius( function( d ){
                return d.y;
            } )
            .angle( function( d ){
                return d.x / 180 * Math.PI;
            } );

        var svg = d3.select( "#d3chart" ).append( "svg" )
            .attr( "width", window.innerWidth )
            .attr( "height", window.innerHeight - 200 )
            .append( "g" )
            .attr( "transform", "translate(" + window.innerWidth / 2 + "," + radius + ")" );

        var link = svg.append( "g" ).selectAll( ".d3link" ),
            node = svg.append( "g" ).selectAll( ".node" );

        var nodes = cluster.nodes( packageHierarchy( data ) ),
            links = packageImports( nodes );

        link = link
            .data( bundle( links ) )
            .enter().append( "path" )
            .each( function( d ){
                d.source = d[ 0 ], d.target = d[ d.length - 1 ];
            } )
            .attr( "class", "d3link" )
            .attr( "d", line );

        node = node
            .data( nodes.filter( function( n ){
                return !n.children;
            } ) )
            .enter().append( "text" )
            .attr( "class", "node" )
            .attr( "dy", ".31em" )
            .attr( "transform", function( d ){
                return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
            } )
            .style( "text-anchor", function( d ){
                return d.x < 180 ? "start" : "end";
            } )
            .text( function( d ){
                return d.name;
            } )
            .on( "mouseover", mouseovered )
            .on( "mouseout", mouseouted );

        function mouseovered( d ){
            node
                .each( function( n ){
                    n.target = n.source = false;
                } );

            link
                .classed( "link--target", function( l ){
                    if( l.target === d ) return l.source.source = true;
                } )
                .classed( "link--source", function( l ){
                    if( l.source === d ) return l.target.target = true;
                } )
                .filter( function( l ){
                    return l.target === d || l.source === d;
                } )
                .each( function(){
                    this.parentNode.appendChild( this );
                } );

            node
                .classed( "node--target", function( n ){
                    return n.target;
                } )
                .classed( "node--source", function( n ){
                    return n.source;
                } );
        }

        function mouseouted( d ){
            link
                .classed( "link--target", false )
                .classed( "link--source", false );

            node
                .classed( "node--target", false )
                .classed( "node--source", false );
        }

        d3.select( self.frameElement ).style( "height", diameter + "px" );

        function packageHierarchy( classes ){
            var map = {};

            function find( name, data ){
                var node = map[ name ], i;
                if( !node ){
                    node = map[ name ] = data || { name: name, children: [] };
                    if( name.length ){
                        node.parent = find( name.substring( 0, i = name.lastIndexOf( "." ) ) );
                        node.parent.children.push( node );
                        node.key = name.substring( i + 1 );
                    }
                }
                return node;
            }

            data.forEach( function( d ){
                find( d.name, d );
            } );

            return map[ "" ];
        }

        function packageImports( nodes ){
            var map = {},
                imports = [];

            nodes.forEach( function( d ){
                map[ d.name ] = d;
            } );

            nodes.forEach( function( d ){
                if( d.imports ) d.imports.forEach( function( i ){
                    imports.push( { source: map[ d.name ], target: map[ i ] } );
                } );
            } );

            return imports;
        }
    },


    renderComponent: function(){
        var self = this;
        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/analytics/network?from_date=' + self.get( 'from_date' ) + '&to_date=' + self.get( 'to_date' ),
                type: 'GET'
            } ).then(
                function( response ){
                    if( !Ember.isEmpty( response.data ) ){
                        self.set( 'data', response.data );
                        self.setConfig();
                    }
                    else{
                        var clear = d3.select( "#d3chart" );
                        clear.selectAll( "*" ).remove();
                        $( "#d3chart" ).append( '<div class="align-center valign-middle text-gray-light" style="padding: 100px; background-color: #f2f4f5;; "><i class="fa fa-line-chart fa-5x"></i><br/>No Data Yet</div>' );
                    }
                },
                function( xhr, status, error ){
                }
            );
        } );
    },

    didInsertElement: function(){
        this.renderComponent();
    },

    watchDate: function(){
        var from_date = this.from_date;
        this.renderComponent();
    }.observes( 'from_date', 'to_date' )
} );
