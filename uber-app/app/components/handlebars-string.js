import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend( {
    init: function(){
        this._super();
        var _this = this;
        var templateContext = this.get( 'templateContext' );

        this.set( 'layout', Ember.Handlebars.compile( this.get( 'templateString' ) ) );

        _.forEach( templateContext, function( value, key ){
            _this.set( key, value );
        } );
    },
    tagName: 'span'
} );
