import DS from 'ember-data';
import StringObjectMixin from 'akx-app/mixins/model-locale';

export default DS.Model.extend( StringObjectMixin, {
    company_id: DS.attr(),

    title: DS.attr(),
    name: DS.attr(),
    status: DS.attr( 'number' ),
    created_at: DS.attr(),

    company: DS.belongsTo( 'company', { async: true } ),
    ticket_messages: DS.hasMany( 'ticket-message', { async: true } ),

    isOpen: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isClosed: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    statusIcon: function(){
        let stringList = this.get( 'getStringList' );
        switch( this.get( 'status' ) ){
            case 0:
                return `<div class="icon-spin"><span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.open}"><i class="akx-icon akx-pending"></i></span></div>`;
            case 1:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.closed}"><i class="akx-icon akx-success"></i></span>`;
            default:
                return '';
        }
    }.property( 'status' ),

    isNewAccount: function(){
        return this.get( 'title' ) === 'New Account Request';
    }.property( 'title' )
} );
