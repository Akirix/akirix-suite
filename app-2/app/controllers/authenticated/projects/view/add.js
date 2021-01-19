import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {
    projectTypes: function(){
        let stringList = this.get( 'stringList' );
        return [
            { label: stringList.tree, val: 0 },
            { label: stringList.voip, val: 1 },
            { label: stringList.smartProject, val: 2 }
        ]
    }.property(),

    deadlineOptions: function(){
        return [
            { label: 'No deadline', val: 0 },
            { label: '1', val: 1 },
            { label: '2', val: 2 },
            { label: '3', val: 3 },
            { label: '4', val: 4 },
            { label: '5', val: 5 },
            { label: '6', val: 6 },
            { label: '7', val: 7 }
        ]
    }.property(),

    contractTypes: function(){
        let stringList = this.get( 'stringList' );
        return [
            { label: stringList.akirixStandardContract, val: 0 },
            { label: stringList.customContract, val: 1 }
        ];
    }.property(),

    projectType: function(){
        if( this.get( 'changeset.type' ) === 1 ){
            return this.get( 'stringList.linear' );
        }
        else if( this.get( 'changeset.type' ) === 2 ){
            return this.get( 'stringList.smartProject' );
        }
        return this.get( 'stringList.tree' );
    }.property( 'changeset.type' ),

    contractType: function(){
        if( this.get( 'changeset.contract_type' ) === 1 ){
            return this.get( 'stringList.custom' );
        }
        return this.get( 'stringList.akirix' );
    }.property( 'changeset.contract_type' ),

    accountObserver: function(){
        let account = this.get( 'account' );
        if( !Ember.isEmpty( account ) ){
            this.setProperties( {
                'changeset.account_id': account.get( 'id' )
            } );
        }
    }.observes( 'account' ),

    isLinear: function(){
        return this.get( 'changeset.type' ) === 1 || this.get( 'isSmart' );
    }.property( 'changeset.type' ),

    isSmart: function(){
        return this.get( 'changeset.type' ) === 2;
    }.property( 'changeset.type' ),

    validateNodeItems(){
        if( this.get( 'isSmart' ) ){
            if( Ember.isEmpty( this.get( 'nodeItems' ) ) ){
                this.set( 'nodeItemsErrors', [ 'Must have one or more item' ] );
                return false;
            }
            else{
                this.set( 'nodeItemsErrors', [] );
                return Ember.isEmpty( this.get( 'nodeItems' ).objectAt( 0 ).get( 'errors.name' ) );
            }
            
        }
        return true;
    },

    actions: {
        confirm(){
            let changeset = this.get( 'changeset' );
            let promises = [];
            [
                'type',
                'account_id',
                'currency_id',
                'contract_type',
                'discount_rate'
            ].forEach( ( validation )=>{
                promises.push( changeset.validate( validation ) );
            } );
            Ember.RSVP.Promise.all( promises ).then( ()=>{
                if( changeset.get( 'isValid' ) && this.validateNodeItems() ){
                    this.send(
                        'openSidePanel',
                        'projects/project-confirmation',
                        'projects/view/side-navs/project-add',
                        this
                    );
                }
            } );
        },
        edit(){
            this.send( 'openSidePanel', 'projects/project-details', '', this );
        },
        setAccount( account ){
            this.setProperties( {
                account: account,
                'changeset.account_id': account.id,
                'changeset.currency_id': account.get( 'currency_id' )
            } );
        },

        saveModel(){
            let changeset = this.get( 'changeset' );
            let project = this.get( 'model.project' );
            let newNode;
            changeset.validate().then( () =>{
                if( changeset.get( 'isValid' ) ){
                    project.set( 'currency_id', changeset.get( 'currency_id' ) );
                    project.set( 'invoice_deadline', changeset.get( 'invoice_deadline' ) );
                    project.set( 'type', changeset.get( 'type' ) );
                    project.set( 'fixed_profit_margin', changeset.get( 'fixed_profit_margin' ) );
                    if( changeset.get( 'type' ) === 2 ){
                        project.set( 'deterministic', 1 );
                        project.set( 'type', 1 );
                    }
                    changeset.save();
                    return project.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid ) =>{
                if( isValid ){
                    let promises = [];
                    newNode = this.store.createRecord( 'node', {
                        company_id: changeset.get( 'company_id' ),
                        name: changeset.get( 'name' ),
                        notes: changeset.get( 'notes' ),
                        account_id: changeset.get( 'account_id' ),
                        discount_rate: changeset.get( 'discount_rate' ),
                        project_id: project.get( 'id' )
                    } );
                    if( !Ember.isEmpty( this.get( 'documents' ) ) ){
                        this.get( 'documents' ).forEach( function( doc ){
                            doc.set( 'model_id', project.get( 'id' ) );
                            doc.set( 'status', 1 );
                            promises.push( doc.save() );
                        } );
                    }
                    promises.push( newNode.save() );
                    return Ember.RSVP.Promise.all( promises );
                }
                return isValid;
            } ).then( ( isValid ) =>{
                if( this.get( 'isLinear' ) && isValid ){
                    let promises = [];
                    this.get( 'nodeItems' ).forEach( ( item ) =>{
                        item.set( 'node_id', newNode.get( 'id' ) );
                        item.set( 'project_id', project.get( 'id' ) );
                        promises.push( item.save() );
                    } );
                    return Ember.RSVP.Promise.all( promises );
                }
                return isValid;
            } ).then( ( isValid ) =>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.transitionToRoute( 'authenticated.projects.view.add.success', {
                        queryParams: {
                            account_id: changeset.get( 'account_id' ),
                            project_id: project.get( 'id' ),
                            contract_type: changeset.get( 'contract_type' )
                        }
                    } );
                }
            } ).catch( ( err ) =>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        },
        deleteModel(){
            this.get( 'changeset' ).rollback();
            this.get( 'model.project' ).destroyRecord();
        }
    }
} );
