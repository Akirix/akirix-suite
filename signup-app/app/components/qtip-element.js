import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'span',
    at: 'top center',
    my: 'bottom center',
    x: 0,
    y: 0,
    qtipClass: '',
    qtip: null,
    label: '<i class="fa fa-question-circle"></i>',
    qtipContent: null,

    updateQtip: function(){
        var _this = this;
        var qtipContent = _this.get( 'qtipContent' );
        var qtip = _this.get( 'qtip' );
        qtip.set( 'content.text', qtipContent );
    }.observes( 'qtipContent' ),

    didInsertElement: function(){
        var _this = this;
        var element = this.$();
        var qtipContent = _this.get( 'qtipContent' );
        var label = _this.get( 'label' );
        element.append( label );

        var qtipOptions = {
            content: {
                text: qtipContent,
                title: '&nbsp;'
            },
            overwrite: true,
            position: {
                at: _this.get( 'at' ),
                my: _this.get( 'my' ),
                viewport: false,
                effect: false,
                adjust: {
                    x: _this.get( 'x' ),
                    y: _this.get( 'y' )
                }
            },
            style: {
                classes: 'qtip-bootstrap help-qtip ' + _this.get( 'qtipClass' )
            },
            show: {
                solo: false,
                ready: false
            },
            events: {
                hide: function( event, api ){
                    if( api.get( 'content.button' ) !== false ){
                        api.set( 'content.button', false );
                    }

                    api.set( 'hide.event', 'mouseleave' );
                }
            }
        };

        // Init qtip
        element.qtip( qtipOptions );
        var qtip = element.qtip( 'api' );

        if( !Ember.isEmpty( qtip ) ){
            _this.set( 'qtip', qtip );
            element.on( 'click', function(){
                var qtip = element.qtip( 'api' );
                qtip.set( 'content.button', true );
                qtip.set( 'hide.event', false );
            } );
        }

    },

    willDestroyElement: function(){
        var element = this.$();
        element.qtip( 'destroy' );
    }
} );
