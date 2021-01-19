import Ember from 'ember';

export default Ember.Component.extend( {
    store: Ember.inject.service(),
    session: Ember.inject.service( 'session' ),

    getDescription: function(){
        let transaction = this.get( 'transaction' );
        if( !Ember.isEmpty( transaction.get( 'model' ) ) && !Ember.isEmpty( transaction.get( 'model_id' ) ) ){
            this.get( 'store' ).findRecord( transaction.get( 'model' ), transaction.get( 'model_id' ) ).then( ( item )=>{
                switch( transaction.get( 'model' ) ){
                    case 'node':
                        this.getNode( item );
                        break;
                    case 'invoice':
                        this.getInvoice( item );
                        break;
                    case 'wire':
                        this.getWire( item );
                        break;
                    case 'commission-payment':
                        this.set( 'description', `Pay Out Date: ${item.get( 'str_payout_date' )}` );
                        break;
                    case 'fx-request':
                        this.set( 'description', `${item.get( 'base_currency_id' )} to ${item.get( 'counter_currency_id' )}`);
                        break;
                    case 'charge':
                        this.set( 'description', item.get( 'title' ) );
                        break;
                    default:
                }
            } );
        }
        else{
            this.set( 'description', '' );
        }
    }.on( 'init' ),

    getNode( item ){
        let promises = [
            this.get( 'store' ).findRecord( 'project', item.get( 'project_id' ) ),
            item.get( 'company' )
        ];
        Ember.RSVP.Promise.all( promises ).then( ( project, company )=>{
            this.set( 'description', `${company.get( 'name' )} <i class="akx-icon akx-projects"></i> Points P-${project.get( 'name' )}` );
        } );
    },

    getInvoice( item ){
        let store = this.get( 'store' );
        item.get( 'company' ).then( ( itemCompany )=>{
            let mine = itemCompany.id === this.get( 'session.data.authenticated.company.id' );
            if( !mine ){
                this.set( 'description', `XYZ${itemCompany.get( 'account_number' )} <i class="akx-icon akx-invoices"></i> Invoice I-${item.get( 'name' )}` );
            }
            else {
                if( item.get( 'type' ) === 0 ){
                    item.get( 'node' ).then( ( node )=>{
                        return store.find( 'node', node.get( 'parent_id' ) );
                    } ).then( ( bnode )=>{
                        return bnode.get( 'company' );
                    } ).then( ( company )=>{
                        this.set( 'description', `XYZ${company.get( 'account_number' )} <i class="akx-icon akx-invoices"></i> Invoice I-${item.get( 'name' )}` );
                    } );
                }
                else if( item.get( 'type' ) === 1 ){
                    item.get( 'toCompany' ).then( ( toCompany )=>{
                        this.set( 'description', `XYZ${toCompany.get( 'account_number' )} <i class="akx-icon akx-invoices"></i> Invoice I-${item.get( 'name' )}` );
                    } );
                }
            }
        } );
    },

    getWire( item ){
        item.get( 'company' ).then( ( company )=>{
            let comp = company.id === this.get( 'session.data.authenticated.company.id' ) ? item.get( 'account_holder' ) : company.get( 'name' );
            this.set( 'description', `${comp} <i class="akx-icon akx-wire-transfer"></i> ${item.get( 'strMethod' )}  W-${item.get( 'name' )}` );
        } );
    }
} );
