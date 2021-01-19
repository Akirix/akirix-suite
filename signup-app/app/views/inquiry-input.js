import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.View.extend( EmberValidations.Mixin, {
    position: '',
    name: '',
    contact: '',
    answer: null,
    validations: {
        answer: {
            presence: true
        }
    },

    binaryYes: function(){
        return this.get( 'binaryAnswer' ) === 'Yes';
    }.property( 'binaryAnswer' ),

    showContactDetails: function(){
        return this.get( 'binaryAnswer' ) === 'No';
    }.property( 'binaryAnswer' ),

    answerDidChange: function(){
        this._updateAnswer();
    }.observes( 'answer' ),

    _updateAnswer: function(){
        var _this = this;
        this.validate()
            .then( function(){
                _this.set( 'inquiry.answer', _this._getAnswer() );
            }, function( errors ){
                _this.set( 'inquiry.answer', null );
                Ember.Logger.log( 'Answer not valid' );
                Ember.Logger.log( errors );
            } );
    },

    _getAnswer: function(){
        return this.get( 'answer' );
    },

    init: function(){
        var _this = this;
        var type = this.get( 'inquiry.type' );
        var answer = this.get( 'inquiry.answer' );

        if( !Ember.isEmpty( answer ) ){
            this.set( 'answer', answer );
        }

        switch( type ){
            case 0:
                _this.set( 'templateName', 'views/inquiries/textarea-input' );
                break;
            case 1:
                _this.set( 'templateName', 'views/inquiries/binary-input' );
                break;
            case 2:
                _this.set( 'templateName', 'views/inquiries/text-input' );
                break;

            case 3:

                _this.set( 'validations', {
                    binaryAnswer: { presence: true },
                    position: { presence: { unless: 'binaryYes' } },
                    name: { presence: { unless: 'binaryYes' } },
                    contact: { presence: { unless: 'binaryYes' } }
                } );

                // Initialize the values
                if( !Ember.isEmpty( answer ) ){
                    if( answer === 'Yes' ){
                        _this.set( 'binaryAnswer', 'Yes' );
                    }
                    else{
                        _this.set( 'binaryAnswer', 'No' );

                        if( !Ember.isEmpty( answer.name ) ){
                            _this.set( 'name', answer.name );
                        }

                        if( !Ember.isEmpty( answer.position ) ){
                            _this.set( 'position', answer.position );
                        }

                        if( !Ember.isEmpty( answer.contact ) ){
                            _this.set( 'contact', answer.contact );
                        }
                    }
                }

                _this.set( '_getAnswer', function(){
                    if( _this.get( 'binaryAnswer' ) === 'No' ){
                        return {
                            name: _this.get( 'name' ),
                            contact: _this.get( 'contact' ),
                            position: _this.get( 'position' )
                        };
                    }
                    else{
                        return _this.get( 'binaryAnswer' );
                    }
                } );

                Ember.addObserver( _this, 'binaryAnswer', _this, _this._updateAnswer );
                Ember.addObserver( _this, 'name', _this, _this._updateAnswer );
                Ember.addObserver( _this, 'position', _this, _this._updateAnswer );
                Ember.addObserver( _this, 'contact', _this, _this._updateAnswer );

                _this.set( 'templateName', 'views/inquiries/executive-team' );
                break;

            case 4:
                _this.set( 'templateName', 'views/inquiries/hear-about-us' );
                break;

        }

        this._super();
    }
} );

