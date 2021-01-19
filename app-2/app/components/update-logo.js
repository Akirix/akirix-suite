import Ember from 'ember';

export default Ember.Component.extend( {
    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.update-logo' ) );
    }.on( 'init' ),
    imgSrc: '',

    actions: {
        uploadImg( file ){
            file.readAsDataURL().then( ( url )=>{
                this.set( 'imgSrc', url );
            } );
        }
    }
} );