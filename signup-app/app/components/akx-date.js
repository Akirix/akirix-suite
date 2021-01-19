import Ember from 'ember';

export default Ember.Component.extend( {
    date: null,
    classNames: [ 'akx-date' ],
    yearSort: 'desc',
    dateFormat: 'YYYY-MM-DD',

    dayDisabled: function(){
        return Ember.isEmpty( this.get( 'month' ) );
    }.property( 'month' ),

    years: function(){
        var maxYear = this.get( 'maxYear' );
        var maxYearType = typeof maxYear;
        var minYear = this.get( 'minYear' );
        var minYearType = typeof minYear;
        var currentYear = new Date().getUTCFullYear();
        var startYear = currentYear;
        var endYear = currentYear + 10;
        var yearSort = this.get( 'yearSort' ).toLowerCase();

        if( minYearType === 'number' ){
            startYear = minYear;
        }
        else if( minYearType === 'string' && minYear === 'current' ){
            startYear = currentYear;
        }

        if( maxYearType === 'number' ){
            endYear = maxYear;
        }
        else if( maxYearType === 'string' && maxYear === 'current' ){
            endYear = currentYear;
        }

        var years = [];

        if( yearSort === 'desc' ){
            for( var i = endYear; i >= startYear; i-- ){
                years.push( i );
            }
        }
        else{
            for( var j = startYear; j <= endYear; j++ ){
                years.push( j );
            }
        }

        return years;

    }.property( 'maxYear', 'minYear' ),

    months: [
        { name: "January", number: 1 },
        { name: "February", number: 2 },
        { name: "March", number: 3 },
        { name: "April", number: 4 },
        { name: "May", number: 5 },
        { name: "June", number: 6 },
        { name: "July", number: 7 },
        { name: "August", number: 8 },
        { name: "September", number: 9 },
        { name: "October", number: 10 },
        { name: "November", number: 11 },
        { name: "December", number: 12 }
    ],

    days: function(){
        var month = this.get( 'month' );
        var year = this.get( 'year' );

        if( typeof year === 'undefined' ){
            year = new Date().getFullYear();
        }

        var daysInMonth = moment( year + ' ' + month + ' ' + 1, 'YYYY-MM-DD' ).daysInMonth();

        var days = [];
        for( var i = 1; i <= daysInMonth; i++ ){
            days.push( i );
        }

        return days;
    }.property( 'month', 'year' ),

    dateWatcher: function(){
        var day = this.get( 'day' );
        var month = this.get( 'month' );
        var year = this.get( 'year' );

        if( typeof day === 'number' && typeof month === 'number' && typeof year === 'number' ){
            var date = moment( year + ' ' + month + ' ' + day, 'YYYY-MM-DD' );
            this.set( 'date', date.format( this.get( 'dateFormat' ) ) );
        }
        else{
            this.set( 'date', null );
        }
    }.observes( 'day', 'month', 'year' ),

    init: function(){
        this._super();
        var date = this.get( 'date' );

        if( typeof date !== 'undefined' && date !== null ){
            date = moment( date ).utc();

            if( date.isValid() ){
                this.set( 'year', date.year() );
                this.set( 'month', date.month() + 1 );
                this.set( 'day', date.date() );
            }
        }
    }
} );
