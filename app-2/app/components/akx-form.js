
import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'form',
    layoutName: 'akx-form',
    spinner: '<i class="spinner"></i>',
    attributeBindings: ['name'],

    didRender(){
        Ember.run.debounce( this, this.invokeBootstrap, 150 );
        Ember.run.later( this, this.initSelectpickersUISlider, 500 );
    },

    didInsertElement(){
        Ember.run.later( this, this.initFormExtendedDatetime, 500 );
    },

    invokeBootstrap(){
        if( !this.isDestroyed ){
            this.$( this.$().html() ).bootstrapMaterialDesign();
        }
    },

    lockAction(){
        if( !this.get( 'isLocked' ) ){
            this.set( 'isLocked', true );
            if( typeof this.get( 'action' ) === 'string' ){
                this.sendAction();
            }
            else {
                this.get( 'action' )();
            }
        }
    },

    submit: function( e ){
        e.preventDefault();
        this.lockAction();
    },

    initSelectpickersUISlider(){
        if( !Ember.isEmpty( this.$('.selectpicker') ) ){
            this.$( '.selectpicker' ).selectpicker();
        }
        if( !Ember.isEmpty( this.$('#sliderRegular') ) ){
            noUiSlider.create(this.$('#sliderRegular')[0], {
                start: 40,
                connect: [true, false],
                range: {
                    min: 0,
                    max: 100
                }
            });
        }
    },

    initFormExtendedDatetime(){
        let icons = {
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

        if( !Ember.isEmpty( this.$( '.datetimepicker' ) ) ){
            // Bring in locale
            this.$( '.datetimepicker' ).datetimepicker( {
                format: 'YYYY/MM/DD HH:mm',
                icons: icons
            } );
        }

        if( !Ember.isEmpty( this.$( '.datepicker' ) ) ){
            this.$( '.datepicker' ).datetimepicker( {
                // Add I18n date format
                format: 'MM/DD/YYYY',
                useCurrent: false,
                icons: icons
            } );
        }

        if( !Ember.isEmpty( this.$( '.timepicker' ) ) ){
            this.$( '.timepicker' ).datetimepicker( {
                // format: 'H:mm',    // use this format if you want the 24hours timepicker
                format: 'h:mm A', //use this format if you want the 12hours timpiecker with AM/PM toggle
                icons: icons
            } );
        }
      }
} );
