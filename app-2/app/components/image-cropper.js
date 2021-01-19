import Ember from 'ember';
import imageCropper from 'ember-cli-image-cropper/components/image-cropper';

export default imageCropper.extend( {
    tagName: 'div',
    classNames: [ 'image-cropper-container' ],
    aspectRatio: 1,
    minCropBoxWidth: 100,
    minCropBoxHeight: 100,
    autoCrop: false,

    didInsertElement(){
        this.getCanvas();
    },

    getCanvas: function(){
        Ember.$( this.get( 'cropperContainer' ) ).cropper( 'crop' );
    },

    actions: {
        getCroppedData(){
            let img = Ember.$( this.get( 'cropperContainer' ) );
            let data = Ember.$( this.get( 'cropperContainer' ) ).cropper( 'getCropBoxData' );
            let canvas = Ember.$( this.get( 'cropperContainer' ) ).cropper( 'getCroppedCanvas',{
                width: 500,
                height: 500
            } );
            let ctx = canvas.getContext( '2d' );
            ctx.drawImage( img[0], data.left, data.top, data.width, data.height, data.left, data.top, 16, 9);
            this.setProperties( {
                content: canvas.toDataURL(),
                imgSrc: null
            } );
        }
    }
} );