import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'div',
    classNames: [],

    getItems: function(){
        this.get( 'akxUtil' ).authAjax( {
            type: 'GET'
        }, '/stats/pending-items' ).then( ( response )=>{
            this.set( 'pendingItems', response.data.map( ( item )=>{
                if( item.name === 'invoices' ){
                    item.link = 'authenticated.invoices.invoices';
                    item.icon = '<i class="akx-icon akx-invoices font-h3"></i>'
                }
                else if( item.name === 'bills' ){
                    item.link = 'authenticated.invoices.bills';
                    item.icon = '<i class="akx-icon akx-pending-invoice font-h3"></i>'
                }
                else{
                    item.link = 'authenticated.projects.index';
                    item.icon = '<i class="akx-icon akx-pending-invite font-h3"></i>'
                }
                return item;
            } ) );
        } );
    }.on( 'init' )
} );
