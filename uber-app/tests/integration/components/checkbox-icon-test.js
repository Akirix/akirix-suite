/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'checkbox-icon',
  'Integration: CheckboxIconComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#checkbox-icon}}
      //     template content
      //   {{/checkbox-icon}}
      // `);

      this.render(hbs`{{checkbox-icon}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
