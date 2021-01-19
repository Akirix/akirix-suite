import DS from 'ember-data';
import _ from 'lodash/lodash';

export default DS.Model.extend( {
    uber_user_id: DS.attr(),
    company_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    model: DS.attr(),
    model_id: DS.attr(),
    title: DS.attr(),
    notes: DS.attr(),
    notes_new: DS.attr(),
    due_date: DS.attr(),
    type: DS.attr( 'number' ),
    status: DS.attr( 'number' ),
    sentiment: DS.attr( 'number' ),
    priority: DS.attr( 'number' ),

    uberUser: DS.belongsTo( 'uber-user', { async: true } ),

    isDue: function(){
        var dueDate = this.get( 'due_date' );
        var type = this.get( 'type' );
        if( type === 0 ){
            return moment( dueDate ).unix() < moment().unix();
        }
        else{
            return false;
        }
    }.property( 'due_date' ),
    isNote: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isTask: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' ),

    isOpen: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isPending: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isComplete: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    str_updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_updated_at_time: function(){
        return moment( this.get( 'updated_at' ) ).format( 'HH:mm:ss' );
    }.property( 'updated_at' ),

    str_created_at_date: function(){
        return  moment( this.get( 'created_at' )).format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_created_at_time: function(){
        return moment( this.get( 'created_at' ) ).format( 'HH:mm:ss' );
    }.property( 'created_at' ),

    str_due_date: function(){
        return moment( this.get( 'due_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'due_date' ),

    str_due_time: function(){
        return  moment( this.get( 'due_date' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'due_date' ),

    noteEntries: function(){
        var noteRearrangeArray = [];
        var noteEntries = [];

        var seperatorReg =  /((?:.*)(?:\s)@(?:\s)\d{4}-\d{2}-\d{2}(?:\s)\d{2}:\d{2}:\d{2})/;

        if( this.get('notes') ){
            noteRearrangeArray = this.get('notes').split(seperatorReg);
            noteRearrangeArray.shift();
            noteRearrangeArray.forEach(function( entry, index ){
                if( index % 2 === 0 ){
                    var msg ={
                        user: '',
                        notes: ''
                    };

                    msg.user = entry.trim();
                    msg.notes = noteRearrangeArray[index+1].trim();
                    noteEntries.push( msg );
                }

            });
        }
        return noteEntries;

    }.property( 'notes' )

} );

