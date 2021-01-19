
import Ember from "ember";

export default Ember.Component.extend( {
    markdownContent: null,
    newShowdownConverter: null,
    newHTML: null,

    init: function(){
        this._super();
        this.set( 'newShowdownConverter', new showdown.Converter({
            simplifiedAutoLink: true,
            excludeTrailingPunctuationFromURLs: true,
            simpleLineBreaks: true,
            smoothLivePreview: true,
            emoji: true
        }) );
        this.newPreview();
    },

    newPreview: function(){
        this._super();
        this.set( 'newHTML', Ember.get( this, 'newShowdownConverter' ).makeHtml( Ember.get( this, 'markdownContent' ) ) );
    },

    watchPreview: function(){
        this.newPreview();
    }.observes( 'markdownContent' )

} );