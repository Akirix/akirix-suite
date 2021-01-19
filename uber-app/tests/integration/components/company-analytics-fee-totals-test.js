/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'company-analytics-fee-totals',
  'Integration: CompanyAnalyticsFeeTotalsComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#company-analytics-fee-totals}}
      //     template content
      //   {{/company-analytics-fee-totals}}
      // `);

      this.render(hbs`{{company-analytics-fee-totals}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
