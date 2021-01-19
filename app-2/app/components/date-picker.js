import Ember from 'ember';

export default Ember.Component.extend( {
  tagName: 'div',
  classNames: [ 'has-feedback', 'form-group', 'bmd-form-group' ],

  didInsertElement() {
    this.$( 'input' ).datetimepicker( {
      // Add I18n date format
      format: 'MM/DD/YYYY',
      useCurrent: false,
      icons: {
        time: "fa fa-clock-o",
        date: "akx-icon akx-calendar",
        up: "fa fa-chevron-up",
        down: "akx-icon akx-down",
        previous: 'akx-icon akx-left',
        next: 'akx-icon akx-right',
        today: 'fa fa-screenshot',
        clear: 'akx-icon akx-delete',
        close: 'akx-icon akx-rejected'
      }
    } ).on( 'dp.hide', () => {
      this.set( 'value', this.get( 'value' ).trim() );
    } );

    if ( this.get( 'elementId' ) === 'fromDate' ) {
      this.$( 'input' ).on( 'dp.change', ( e ) => {
        Ember.$( '#toDate input' ).data( 'DateTimePicker' ).minDate( e.date );
      } );
    }

    if ( this.get( 'elementId' ) === 'toDate' ) {
      this.$( 'input' ).on( 'dp.change', ( e ) => {
        Ember.$( '#fromDate input' ).data( 'DateTimePicker' ).maxDate( e.date );
      } );
    }
  }
} );
