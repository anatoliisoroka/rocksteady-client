import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('validated-input-quantity', 'Integration | Component | validated input quantity', {
  integration: true
});

test('it renders', function(assert) {
  
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });" + EOL + EOL +

  this.render(hbs`{{validated-input-quantity}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:" + EOL +
  this.render(hbs`
    {{#validated-input-quantity}}
      template block text
    {{/validated-input-quantity}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
