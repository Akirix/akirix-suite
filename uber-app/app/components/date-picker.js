import Ember from "ember";

export default Ember.TextField.extend( {

    valueFormat: 'X',           // expect unix timestamp format from data binding
    outputFormat: 'YYYY-MM-DD', // the format to display in the text field
    numberOfMonths: 1,          // the "width" of date picker
    allowBlank: false,          // whether `null` input/result is acceptable
    utc: true,                 // whether the input value is meant as a UTC date
    date: null,
    futureYearRange: 4,
    pastYearRange: 100,
    yearRange: function(){
        var year = window.moment().year();
        return [ year - this.get( 'pastYearRange' ), year + this.get( 'futureYearRange' ) ];
    }.property(), // default yearRange from -3 to +4 years
    // A private method which returns the year range in absolute terms
    _yearRange: function(){
        var yr = this.get( 'yearRange' );
        if( !Ember.$.isArray( yr ) ){
            yr = yr.split( ',' );
        }
        // assume we're in absolute form if the start year > 1000
        if( yr[ 0 ] > 1000 ){
            return yr;
        }
        // relative form must be updated to absolute form
        var cy = window.moment().year();
        return [ cy + yr[ 0 ], cy + yr[ 1 ] ];
    }.property( 'yearRange' ),

    _picker: null,


    didInsertElement: function(){
        var formElement = this.$()[ 0 ],
            that = this,
            picker = new Pikaday( {
                field: formElement,
                format: that.get( 'outputFormat' ),
                yearRange: that.get( '_yearRange' ),
                numberOfMonths: parseInt( that.get( 'numberOfMonths' ), 10 ),
                clearInvalidInput: true,

                onClose: function(){
                    // use `moment` or `moment.utc` depending on `utc` flag
                    var momentFunction = that.get( 'utc' ) ? window.moment.utc : window.moment,
                        d = momentFunction( that.get( 'value' ), that.get( 'outputFormat' ) );

                    // has there been a valid date or any value at all?
                    if( !d.isValid() || !that.get( 'value' ) ){
                        if( that.get( 'allowBlank' ) ){
                            // allowBlank means `null` is ok, so use that
                            return that.set( 'date', null );
                        } else{
                            // "fallback" to current date
                            d = window.moment();
                        }
                    }

                    // update date value with user selected date with consistent format
                    if( that.get( 'valueFormat' ) === 'date' ){
                        d = d.toDate();
                    } else{
                        d = d.format( that.get( 'valueFormat' ) );
                    }

                    that.set( 'date', d );
                }
            } );

        // store Pikaday element for later access
        this.set( "_picker", picker );

        // initially sync Pikaday with external `date` value
        this.setDate();
    },


    willDestroyElement: function(){
        this.get( '_picker' ).destroy();
        this._super();
    },


    setDate: function(){
        var d = null;
        if( !Ember.isBlank( this.get( 'date' ) ) ){
            // serialize moment.js date either from plain date object or string
            if( this.get( 'valueFormat' ) === 'date' ){
                d = window.moment( this.get( 'date' ) );
            } else{
                d = window.moment( this.get( 'date' ), this.get( "valueFormat" ) );
            }
        } else{
            // no date was found in data source. Either respect that or set it to now
            if( this.get( 'allowBlank' ) ){
                // creates an "Invalid Date" object, which will clear the input field
                d = window.moment( null );
            } else{
                d = window.moment();
            }
        }
        this.get( '_picker' ).setDate( d.format( this.get( 'outputformat' ) ) );
    }.observes( 'date' )
} );
