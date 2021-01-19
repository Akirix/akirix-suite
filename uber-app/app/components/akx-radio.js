import Ember from 'ember';

export default Ember.TextField.extend( {
    attributeBindings: [
        'id',
        'accept',
        'autocomplete',
        'autosave',
        'checked',
        'disabled',
        'dir',
        'formaction',
        'formenctype',
        'formmethod',
        'formnovalidate',
        'formtarget',
        'height',
        'inputmode',
        'lang',
        'list',
        'max',
        'min',
        'multiple',
        'name',
        'pattern',
        'size',
        'step',
        'type',
        'value',
        'width'
    ],
    type: 'radio',
    label: false,
    value: null,
    disabled: false,
    groupValue: null,

    scheduleChangedAction: function(){
        Ember.run.schedule( 'actions', this, function(){
            this.sendAction( 'changed', this.get( 'value' ) );
        } );
    },

    checked: function(){
        return this.get( 'groupValue' ) === this.get( 'value' );
    }.property( 'groupValue', 'value' ),

    click: function(){
        if( !this.get( 'disabled' ) ){
            var value = this.get( 'value' );
            var groupValue = this.get( 'groupValue' );
            this.set( 'groupValue', value );
            if( groupValue !== value ){
                this.scheduleChangedAction();
            }
        }
    },

    didInsertElement: function(){
        var _this = this;
        var element = this.$();
        var id = this.get( 'id' );

        if( Ember.isEmpty( id ) ){
            this.set( 'id', 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ){
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString( 16 );
            } ) );
        }

        // Set up label
        var label = _this.get( 'label' );
        var labelClass = _this.get( 'labelClass' );
        if( !Ember.isEmpty( label ) && label !== false ){
            var labelHtml = '<label ';

            if( !Ember.isEmpty( labelClass ) && labelClass !== false ){
                labelHtml += 'class="' + labelClass + '" ';
            }

            labelHtml += 'for="' + _this.get( 'id' ) + '">' + label + '</label>';
            element.after( labelHtml );
        }

        var labelElement = element.siblings( 'label[for=' + _this.get( 'id' ) + ']' );
        if( labelElement.length > 0 ){
            labelElement.on( 'click', function(){
                _this.click();
            } );
        }
    }
} );
