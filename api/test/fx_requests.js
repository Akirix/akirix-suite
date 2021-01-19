var chai = require( 'chai' );
var expect = require( 'chai' ).expect;
var request = require( 'request' );
var should = chai.should();

var fxRequests = require( '../controllers/fx_requests' );

describe( 'FX REQUESTS', function(){
    describe('getECBRates', function(){
        it( 'should get ECB Rates for USD', function(){
            fxRequests.getECBRates( 'USD' )
                .then( function( baseRates ){
                    console.log(baseRates);
                    expect( baseRates ).to.be.a( 'object' );
                    expect( baseRates.USD ).to.be.a( 'number' );
                    expect( baseRates.USD ).to.equal( 1 );
                } );
        } );
        it( 'should get ECB Rates for EUR', function(){
            fxRequests.getECBRates( 'EUR' )
                .then( function( baseRates ){
                    console.log(baseRates);
                    expect( baseRates ).to.be.a( 'object' );
                    expect( baseRates.EUR ).to.be.a( 'number' );
                    expect( baseRates.EUR ).to.equal( 1 );
                } );
        } );
        it( 'should get ECB Rates for GBP', function(){
            fxRequests.getECBRates( 'GBP' )
                .then( function( baseRates ){
                    console.log(baseRates);
                    expect( baseRates ).to.be.a( 'object' );
                    expect( baseRates.GBP ).to.be.a( 'number' );
                    expect( baseRates.GBP ).to.equal( 1 );
                } );
        } );
    });
} );