/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'draggable-item',
  'Integration: DraggableItemComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#draggable-item}}
      //     template content
      //   {{/draggable-item}}
      // `);

      this.render(hbs`{{draggable-item}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
