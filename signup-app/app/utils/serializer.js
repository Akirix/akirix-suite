import Ember from 'ember';

export default Ember.Mixin.create( {
    getJSON: function(){
        var v, ret = [];
        for( var key in this ){
            if( this.hasOwnProperty( key ) ){
                v = this[ key ];

                // ignore useless items
                if( v === 'toString' ){
                    continue;
                }

                // ignore computedProperties
                if( typeof v._dependentKeys !== 'undefined' ){
                    continue;
                }

                if( Ember.typeOf( v ) === 'function' ){
                    continue;
                }
                ret.push( key );
            }
        }

        return this.getProperties.apply( this, ret );
    }
} );
