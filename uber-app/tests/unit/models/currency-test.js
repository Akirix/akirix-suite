import { expect } from 'chai';
import {describeModel,it} from 'ember-mocha';

describeModel( 'currency', 'CURRENCY', {
        // Specify the other units that are required for this test.
    },
    function(){
        describe( 'CURRENCIES', function(){
            it( 'should be USD', function(){
                let usd = this.subject().set('id', 'USD');
                expect( usd.get( 'isUSD' ) ).to.equal( true );
            } );
            it( 'should be EUR', function(){
                let eur = this.subject().set('id', 'EUR');
                expect( eur.get( 'isEUR' ) ).to.equal( true );
            } );
            it( 'should be GBP', function(){
                let gbp = this.subject().set('id', 'GBP');
                expect( gbp.get( 'isGBP' ) ).to.equal( true );
            } );
        } );
    }
);