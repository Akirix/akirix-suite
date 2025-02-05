/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'search-dropdown',
  'Integration: SearchDropdownComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#search-dropdown}}
      //     template content
      //   {{/search-dropdown}}
      // `);

      this.render(hbs`{{search-dropdown}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
