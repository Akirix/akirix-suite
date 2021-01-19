import Ember from 'ember';

export default Ember.Mixin.create( {
    getStringList: function(){
        return this.localeFile[ this.get( '_internalModel.modelName' ) ];
    }.property()
} );