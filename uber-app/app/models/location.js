import Ember from 'ember';
import DS from 'ember-data';


export default DS.Model.extend( {
    name: DS.attr(),
    abbreviation: DS.attr(),
    type: DS.attr()

} );
