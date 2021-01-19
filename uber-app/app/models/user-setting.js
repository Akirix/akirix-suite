import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    user_id: DS.attr(),
    show_welcome: DS.attr( 'boolean' ),
    show_getting_started: DS.attr( 'boolean' )

} );

