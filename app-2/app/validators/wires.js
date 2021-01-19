import brnv from 'npm:bank-routing-number-validator';
import ibantools from 'npm:ibantools';

export default function validateWire(){
    return function( key, newValue, oldValue, changes, content ){
        switch( key ){
            case 'code_aba':
                if( oldValue && changes.code_aba ){
                    if( !changes.bank_country && content.get( 'bank_country' ) !== 'US' && newValue ){
                        return 'ABA is only used for US banks only';
                    }
                    else if( changes.bank_country && changes.bank_country !== 'US' && newValue ){
                        return 'ABA is only used for US banks only';
                    }
                    else if( changes.bank_country === 'US' || content.get( 'bank_country' ) === 'US' ){
                        if( !content.get( 'code_swift' ) && !oldValue ){
                            return 'ABA or SWIFT is required';
                        }
                        if( oldValue && !brnv.ABARoutingNumberIsValid( oldValue ) ){
                            return 'Invalid ABA/Routing number';
                        }
                    }
                }
                else{
                    if( newValue && content.get( 'bank_country' ) && content.get( 'bank_country' ) !== 'US' ){
                        return 'ABA is only used for US banks only';
                    }
                    else if( newValue && changes.bank_country && changes.bank_country !== 'US' ){
                        return 'ABA is only used for US banks only';
                    }
                    else if( content.get( 'bank_country' ) === 'US' || changes.bank_country === 'US' ){
                        if( !content.get( 'code_swift' ) && !newValue ){
                            if( !changes.code_swift ){
                                return 'ABA or SWIFT is required';
                            }
                        }
                        if( newValue && !brnv.ABARoutingNumberIsValid( newValue ) ){
                            return 'Invalid ABA/Routing number';
                        }
                    }
                }
                return true;
            case 'code_swift':
                if( oldValue && !newValue ){
                    if( ( changes.bank_country && changes.bank_country !== 'US' ) ){
                        return 'SWIFT required for International wires';
                    }
                    if( oldValue && !ibantools.isValidBIC( oldValue ) ){
                        return 'Invalid SWIFT';
                    }
                }
                else{
                    if( !newValue && ( changes.bank_country && changes.bank_country !== 'US' ) ){
                        return 'SWIFT required for International wires';
                    }
                    if( newValue && !ibantools.isValidBIC( newValue ) ){
                        return 'Invalid SWIFT';
                    }
                }
                return true;
            case 'intermediary_bank_code_aba':
                if( oldValue && !newValue ){
                    if( oldValue && changes.intermediary_bank_country && changes.intermediary_bank_country !== 'US' ){
                        return 'ABA is only used for US banks only. Use SWIFT field instead';
                    }
                    else if( oldValue && content.get( 'bank_country' ) && content.get( 'bank_country' ) !== 'US' ){
                        return 'ABA is only used for US banks only. Use SWIFT field instead';
                    }
                    else if( content.get( 'intermediary_bank_country' ) === 'US' || changes.intermediary_bank_country === 'US' ){
                        if( !changes.intermediary_bank_code_swift && !oldValue ){
                            return 'ABA or SWIFT is required';
                        }
                        if( oldValue && !brnv.ABARoutingNumberIsValid( oldValue ) ){
                            return 'Invalid ABA/Routing number';
                        }
                    }
                }
                else{
                    if( newValue && changes.intermediary_bank_country && changes.intermediary_bank_country !== 'US' ){
                        return 'ABA is only used for US banks only. Use SWIFT field instead';
                    }
                    else if( newValue && content.get( 'bank_country' ) && content.get( 'bank_country' ) !== 'US' ){
                        return 'ABA is only used for US banks only. Use SWIFT field instead';
                    }
                    else if( content.get( 'intermediary_bank_country' ) === 'US' || changes.intermediary_bank_country === 'US' ){
                        if( ( !changes.intermediary_bank_code_swift ) && !newValue ){
                            if( !content.get( 'intermediary_bank_code_swift' ) ){
                                return 'ABA or SWIFT is required';
                            }
                        }
                        if( newValue && !brnv.ABARoutingNumberIsValid( newValue ) ){
                            return 'Invalid ABA/Routing number';
                        }
                    }
                }
                return true;
            case 'intermediary_bank_code_swift':
                if( oldValue && !newValue ){
                    if( content.get( 'intermediary_bank_country' ) && content.get( 'intermediary_bank_country' ) !== 'US' ){
                        if( !changes.intermediary_bank_code_swift && !newValue ){
                            return 'Swift required for international wire';
                        }
                        if( oldValue && !ibantools.isValidBIC( oldValue ) ){
                            return 'Invalid SWIFT';
                        }
                    }
                }
                else{
                    if( !newValue && ( changes.intermediary_bank_country && changes.intermediary_bank_country !== 'US' ) ){
                        return 'Swift required for international wire';
                    }
                    if( newValue && !ibantools.isValidBIC( newValue ) ){
                        return 'Invalid SWIFT';
                    }
                }
                return true;
            case 'intermediary_bank_name':
                if( changes.use_intermediary_bank ){
                    if( !newValue ){
                        if( !oldValue ){
                            return 'Bank Name cannot be blank'
                        }
                    }
                }
                return true;
            case 'account_iban':
                if( oldValue ){
                    if( newValue ){
                        if( !ibantools.isValidIBAN( newValue ) ){
                            return 'Invalid IBAN';
                        }
                       
                        return true;
                    }
                    else{
                        if( changes.account_number ){
                            return true;
                        }
                        else if( changes.bank_country && changes.bank_country !== 'US' ){
                            return 'IBAN required';
                        }
                        else{
                            return 'IBAN required'
                        }
                    }
                }
                else{
                    if( newValue ){
                        if( changes.bank_country && changes.bank_country === 'US' ){
                            return 'IBAN is only used for none US banks only. Use Account Number field instead';
                        }
                        else if( !ibantools.isValidIBAN( newValue ) ){
                            return 'Invalid IBAN'
                        }
                    }
                    else{
                        if( changes.account_number || content.get( 'account_number' ) ){
                            return true;
                        }
                        else{
                            return 'Account number and IBAN required';
                        }
                    }
                }
                return true;
            case 'account_holder_nationality':
            case 'account_holder_dob':
                if( changes.beneficiary_type === 0 || content.get( 'beneficiary_type' ) === 0 ){
                    return newValue ? true : `${key} required with individual beneficiary type`;
                }
                return true;
            case 'method':
                if( newValue === 1 && changes.bank_country && changes.bank_country !== 'US' ){
                    return 'ACH transfers are for US banks only please change method to wire or choose a US Bank';
                }
                return true;
            case 'bank_state_province':
                if( oldValue ){
                    if( ( changes.bank_country === 'US' || content.get( 'bank_country' ) === 'US' ) && !newValue ){
                        return 'Bank State Province cannot be blank';
                    }
                    if( !newValue ){
                        if( changes.bank_country === 'US' || content.get( 'bank_country' ) === 'US' ){
                            return 'Bank State Province cannot be blank';
                        }
                    }
                }
                else{
                    if( !newValue ){
                        if( changes.bank_country === 'US' ){
                            return 'Bank State Province cannot be blank';
                        }
                    }
                }
                return true;
            case 'account_holder_state_province':
                if( changes.account_holder_country === 'US' || content.get( 'account_holder_country' ) === 'US' ){
                    if( !newValue ){
                        return 'Account Holder State Province cannot be blank';
                    }
                }
                return true;
            case 'intermediary_bank_state_province':
                if( changes.intermediary_bank_country === 'US' || content.get( 'intermediary_bank_country' ) === 'US' ){
                    if( !newValue ){
                        return 'Intermediary Bank State Province cannot be blank';
                    }
                }
                return true;
            default:
                return true;
        }
    }
}