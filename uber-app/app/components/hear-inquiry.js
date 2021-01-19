import Ember from 'ember';

export default Ember.Component.extend( {
    answer: null,
    answer_1: null,
    answer_2: null,
    firstList: [
        { value: 'Referred', label: 'Referred by another Akirix member' },
        { value: 'Social Media', label: 'Social Media' },
        { value: 'website', label: 'From XXX.com' },
        { value: 'Other', label: 'Other' }
    ],
    socialList: [
        { value: 'Facebook', label: 'Facebook' },
        { value: 'Twitter', label: 'Twitter' },
        { value: 'LinkedIn', label: 'LinkedIn' },
        { value: 'Google+', label: 'Google+' },
        { value: 'YouTube', label: 'YouTube' }
    ],

    showText: function(){
        var answer1 = this.get( 'answer_1' );
        return answer1 === 'Other' || answer1 === 'Referred';
    }.property( 'answer_1' ),

    textLabel: function(){
        var answer1 = this.get( 'answer_1' );
        if( answer1 === 'Referred' ){
            return 'Akirix Account Number';
        }
        else{
            return 'Where did you hear about us?';
        }
    }.property( 'answer_1' ),

    showSocial: function(){
        return this.get( 'answer_1' ) === 'Social Media';
    }.property( 'answer_1' ),

    answerDidChange: function(){
        this.set( 'answer', {
            answer_1: this.get( 'answer_1' ),
            answer_2: this.get( 'answer_2' )
        } );
    }.observes( 'answer_1', 'answer_2' ),

    init: function(){
        this._super();
        Ember.run.schedule( 'actions', this, function(){
            var answer_1 = this.get( 'answer.answer_1' );
            var answer_2 = this.get( 'answer.answer_2' );

            if( !Ember.isEmpty( answer_1 ) || !Ember.isEmpty( answer_2 ) ){
                this.set( 'answer_1', answer_1 );
                this.set( 'answer_2', answer_2 );
            }
        } );
    }
} );
