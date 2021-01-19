import Ember from 'ember';

export default Ember.Mixin.create( {
    query: '',
    fromDate: '',
    toDate: '',
    perPage: 50,
    page: 1,

    queryObs: function(){
        if( Ember.isEmpty( this.get( 'query' ) ) ){
            this.send( 'search' );
        }
    }.observes( 'query' ),

    dateObs: Ember.observer( 'fromDate', 'toDate', function(){
        if( !Ember.isEmpty( this.get( 'fromDate' ) ) && !Ember.isEmpty( this.get( 'toDate' ) ) ){
            this.send( 'search' );
        }
        else if( Ember.isEmpty( this.get( 'fromDate' ) ) && Ember.isEmpty( this.get( 'toDate' ) ) ){
            this.send( 'search' );
        }
    } ),

    actions: {
        search(){
            this.set( 'page', 1 );
            this.send( 'refresh' );
        },

        refresh(){
            return true;
        }
    }
} );