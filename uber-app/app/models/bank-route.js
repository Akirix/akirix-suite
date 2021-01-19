import DS from 'ember-data';
import _ from 'lodash/lodash';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    name: DS.attr(),
    api_out: DS.attr()
} );
