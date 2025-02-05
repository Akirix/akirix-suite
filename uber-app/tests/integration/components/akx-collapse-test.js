/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'akx-collapse',
  'Integration: AkxCollapseComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#akx-collapse}}
      //     template content
      //   {{/akx-collapse}}
      // `);

      this.render(hbs`{{akx-collapse}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
