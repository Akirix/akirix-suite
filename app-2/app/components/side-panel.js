import Ember from 'ember';

export default Ember.Component.extend( {
    elementId: "sidePanel",
    pos2: 0,


    didInsertElement(){
        Ember.$( '#sidePanelheader' ).on( 'mousedown', this.dragMouseDown.bind(this) );
        Ember.$( '#sidePanelheader' ).on( 'touchstart', this.touchDrag.bind(this) );
        Ember.$( window ).on( 'resize', this.handleResize.bind(this) );
        this.$().css( { right: `-${this.$().width()+20}px` } );
    },

    handleResize(){
        if(this.get('pos2') && this.$().css( 'right' ) != "0px") {
            // DO NOTHING
        }else if( this.$().css( 'right' ) != "0px" ){
            this.$().css( { right: `-${this.$().width()+20}px` } );
        }
    },

    willDestroyElement(){
        this._super( ...arguments  );
        this.$( window ).off("resize");
    },
    
    dragMouseDown(e){
        e.preventDefault();
        // get the mouse cursor position at startup:
        this.set( 'pos1', e.clientX );
        let elmnt = document.getElementById( 'sidePanel' );
        if( elmnt.style.right === '0px' ){
            this.set( 'pos2', 0 );
        }
        let pos1 = this.get( 'pos1' );
        let pos2 = this.get( 'pos2' );
        
        document.onmouseup = this.closeDragElement.bind(this);
        document.onmousemove = function setStyle(e) {
            // calculate the new cursor position:
            // set the element's new position:
            if(elmnt.style.right.substring(0,elmnt.style.right.indexOf('px')) <= 0){
                if((pos1 - (e.clientX - pos2)) < 0){
                    elmnt.setAttribute('style',`right:${(pos1 - (e.clientX - pos2))}px`);
                    if(pos1-(e.clientX-pos2) < -(elmnt.offsetWidth+30)){
                       elmnt.setAttribute('style', `right:${-(elmnt.offsetWidth)}px`);
                    }
                }
            }
        }
    },

    touchDrag(e){
        e.preventDefault();
        // get the mouse cursor position at startup:
        this.set( 'pos1', e.touches[0].clientX );
        let elmnt = document.getElementById( 'sidePanel' );
        if( elmnt.style.right === '0px' ){
            this.set( 'pos2', 0 );
        }
        const pos1 = e.touches[0].clientX;
        const pos2 = this.get( 'pos2' );

        document.ontouchend = this.closeDragElement.bind(this);
        document.ontouchmove = function setStyle(ev) {
            // calculate the new cursor position:
            // set the element's new position:
            if(elmnt.style.right.substring(0,elmnt.style.right.indexOf('px')) <= 0){
                if(pos1 - (ev.touches[0].clientX - pos2) < 0){
                    elmnt.style.right = `${pos1 - (ev.touches[0].clientX - pos2)}px`;
                    if(pos1-(e.clientX-pos2) < -(elmnt.offsetWidth+30)){
                        elmnt.setAttribute('style', `right:${-(elmnt.offsetWidth)}px`);
                     }
                }
            }
        }
    },

    closeDragElement(){

        let elmnt = document.getElementById( 'sidePanel' );

        if( elmnt.style.right.substring(0,elmnt.style.right.indexOf('px')) < 0 ){
            this.set( 'pos2', elmnt.style.right.substring(0,elmnt.style.right.indexOf('px')) );
        }

        // elmnt.setAttribute('style','right:0px');

        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
} );