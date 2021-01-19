/* jshint expr:true */
import { expect } from 'chai';
import {describeModel,it} from 'ember-mocha';

describeModel( 'account', 'ACCOUNT MODEL TESTS', {
        needs: [ 'model:company', 'model:currency', 'model:fund', 'model:investor', 'model:project' ]
    },
    function(){
        describe( 'FEE TABLE', function(){
            it( 'should set and get the SMALL fee of fee_fx', function(){
                let self = this;
                Ember.run( () =>{
                    let feeSmall = self.subject().set( 'fee_fx', '{"0":0.015}' );
                    expect( feeSmall.get( 'fee_small' ) ).to.be.a( 'number' );
                    expect( feeSmall.get( 'fee_small' ) ).to.equal( 0.015 );
                } );
            } );
            it( 'should set and get the MEDIUM fee of fee_fx', function(){
                let self = this;
                Ember.run( () =>{
                    let feeMed = self.subject().set( 'fee_fx', '{"50001":0.012}' );
                    expect( feeMed.get( 'fee_medium' ) ).to.be.a( 'number' );
                    expect( feeMed.get( 'fee_medium' ) ).to.equal( 0.012 );
                } );
            } );
            it( 'should set and get the LARGE fee of fee_fx', function(){
                let self = this;
                Ember.run( () =>{
                    let feeMed = self.subject().set( 'fee_fx', '{"100001":0.010}' );
                    expect( feeMed.get( 'fee_large' ) ).to.be.a( 'number' );
                    expect( feeMed.get( 'fee_large' ) ).to.equal( 0.010 );
                } );
            } );
        } );
    }
);