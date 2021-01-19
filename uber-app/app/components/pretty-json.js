import Ember from "ember";
export default Ember.Component.extend( {
    tagName: 'pre',

    prettify: function(){
        if( !Ember.isEmpty( this.get( 'jsonObj' ) ) ){
            if( typeof this.get( 'jsonObj' ) === 'object' ){
                return JSON.stringify( this.get( 'jsonObj' ), null, 4 );
            }
            else if( typeof this.get( 'jsonObj' ) === 'string' ){
                return JSON.stringify( JSON.parse( this.get( 'jsonObj' ) ), null, 4 );
            }
            else{
                return '';
            }
        }
        else{
            return '';
        }
    }.property( 'jsonObj' )
} );