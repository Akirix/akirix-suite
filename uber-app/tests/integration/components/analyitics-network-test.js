/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'analyitics-network',
  'Integration: AnalyiticsNetworkComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#analyitics-network}}
      //     template content
      //   {{/analyitics-network}}
      // `);

      this.render(hbs`{{analyitics-network}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
