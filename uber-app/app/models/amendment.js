import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    node_id: DS.attr(),
    node_items: DS.hasMany( 'node_item', { async: true } ),
    status: DS.attr( 'number' ),
    isMine: DS.attr( 'boolean' ),
    canShow: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' )
} );

