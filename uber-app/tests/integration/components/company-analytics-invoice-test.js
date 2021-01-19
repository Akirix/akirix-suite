/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'company-analytics-invoice',
  'Integration: CompanyAnalyticsInvoiceComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#company-analytics-invoice}}
      //     template content
      //   {{/company-analytics-invoice}}
      // `);

      this.render(hbs`{{company-analytics-invoice}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
