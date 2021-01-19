import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend( {
    history_company: DS.attr(),
    history_wire: DS.attr(),

    addHistory: function( historyType, itemId ){
        var itemArray = this.get( 'history_' + historyType );
        if( Ember.isEmpty( itemArray ) ){
            itemArray = Ember.A();
        }
        else{

            var theItem = itemArray.findBy( 'id', itemId );
            if( theItem ){
                itemArray.removeObject( theItem );
            }
        }

        itemArray.unshift( { id: itemId, time: Date.now() } );

        if( itemArray.length === 20 ){
            itemArray.pop();
        }

        Ember.set( this, 'history_' + historyType, itemArray );
    }
} );