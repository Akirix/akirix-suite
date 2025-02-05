/* jshint expr:true */
import { expect } from 'chai';
import {
  describeComponent,
  it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describeComponent(
  'draggable-dropzone',
  'Integration: DraggableDropzoneComponent',
  {
    integration: true
  },
  function() {
    it('renders', function() {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.on('myAction', function(val) { ... });
      // Template block usage:
      // this.render(hbs`
      //   {{#draggable-dropzone}}
      //     template content
      //   {{/draggable-dropzone}}
      // `);

      this.render(hbs`{{draggable-dropzone}}`);
      expect(this.$()).to.have.length(1);
    });
  }
);
