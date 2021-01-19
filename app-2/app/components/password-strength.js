import Ember from 'ember';

export default Ember.Component.extend( {
    passwordStrength: Ember.inject.service(),
    
    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.password-strength' ) );
    }.on( 'init' ),

    strengthProxy(){
        const passwordStrength = this.get( 'passwordStrength' );
        return passwordStrength.strength( this.get( 'changeset.password' ) );
    },

    meter: function(){
        if( !Ember.isEmpty( this.get( 'changeset.password' ) ) ){
            this.strengthProxy().then( ( res )=>{
                switch( res.score ){
                    case 1:
                        Ember.$( '.strength-meter' ).css( { 'width': '25%', 'background-color': '#f00' } );
                        Ember.$( '.password-strength-text' ).text( this.get( 'stringList.ok' ) );
                        break;
                    case 2:
                        Ember.$( '.strength-meter' ).css( { 'width': '50%', 'background-color': '#FFA500' } );
                        Ember.$( '.password-strength-text' ).text( this.get( 'stringList.mediocre' ) );
                        break;
                    case 3:
                        Ember.$( '.strength-meter' ).css( { 'width': '75%', 'background-color': '#D6FF00' } );
                        Ember.$( '.password-strength-text' ).text( this.get( 'stringList.almostThere' ) );
                        break;
                    case 4:
                        Ember.$( '.strength-meter' ).css( { 'width': '100%', 'background-color': '#68af67' } );
                        Ember.$( '.password-strength-text' ).text( this.get( 'stringList.great' ) );
                        break;
                    default:
                        Ember.$( '.strength-meter' ).css( { 'width': '8%', 'background-color': '#D00000' } );
                        Ember.$( '.password-strength-text' ).text( this.get( 'stringList.weak' ) );
                }
            } );
        }
        else{
            Ember.$( '.strength-meter' ).css( { 'width': '0%', 'background-color': '#428bca' } );
            Ember.$( '.password-strength-text' ).text( '' );
        }
    }.observes( 'changeset.password' )
} );