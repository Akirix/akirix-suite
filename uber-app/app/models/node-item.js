import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    node_id: DS.attr(),
    project_id: DS.attr(),

    name: DS.attr(),
    price: DS.attr( 'number' ),

    node: DS.belongsTo( 'node', { async: true } ),
    project: DS.belongsTo( 'project', { async: true } ),

    str_price: function(){
        return locale.format( Number( this.get( 'price' ) ), 'n5' );
    }.property( 'price' )

} );

