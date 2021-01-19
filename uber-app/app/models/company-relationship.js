import DS from 'ember-data';

var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    institution_id: DS.attr(),
    company_id: DS.attr(),
    status: DS.attr(),

    company: DS.belongsTo( 'company', { async: true } ),
    institution: DS.belongsTo( 'company', { async: true } )
} );

