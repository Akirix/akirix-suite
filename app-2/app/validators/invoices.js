export default function validateInvoice(){
    return function( key, newValue, oldValue, changes, content ){
        if( changes.type === 2 || content.get( 'type' ) === 2 ){
            if( key === 'to_company_name' ){
                return newValue ? true : 'To company name is required'
            }
            else if( key === 'to_company_email' ){
                return newValue ? true : 'To company email is required';
            }
        }
        if( key === 'account_number' && ( changes.type !== 2 && content.get( 'type' ) !== 2 ) ){
            return newValue ? true : 'Account Number Required';
        }
        if( key === 'account_id' ){
            if( oldValue ){
                if( content.get( 'type' ) !== 0 && !content.get( 'account_id' ) ){
                    return 'Please choose an account';
                }
            }
            else{
                if( !newValue ){
                    if( changes.type && changes.type !== 0 ){
                        return 'Please choose an account';
                    }
                    else if( content.get( 'type' ) && content.get( 'type' ) !== 0 ){
                        return 'Please choose an account';
                    }
                }
            }
        }
        return true;
    }
}