



var Sequelize = require( 'sequelize' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
var db = require( '../models' );
var Node = db.Node;
var Account = db.Account;
var Project = db.Project;
var Fund = db.Fund;
var Company = db.Company;
var Currency = db.Currency;
var Transaction = db.Transaction;
var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, res, req ){
    util.handleError( 'document', err, res, req );
};






exports.index = function( req, res, next ){
    Fund.findAll( {
        where: [
            Sequelize.or(
                { investor_id: req.user.company_id },
                Sequelize.and(
                    { company_id: req.user.company_id },
                    { status: [ 1, 2 ] }
                )
            )
        ]
    } ).done( function( err, funds ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            _.forEach( funds, function( fund ){
                // Strip out info if not investor who is viewing
                if( fund.values.investor_id !== req.user.company_id ){
                    fund.values.notes = null;
                }
            } );
            res.send( 200, { funds: funds } );
            return next();
        }
    } );
};



exports.create = function( req, res, next ){

    req.assert( 'fund', 'isObject' );
    req.assert( 'fund.account_number', 'isString' );
    req.assert( 'fund.account_id', 'isString' );
    req.assert( 'fund.amount', 'isNumber' );
    req.assert( 'fund.rate', 'isNumber' );
    req.assert( 'fund.end_date', 'isDate' );

    if( _.isEmpty( req.validationErrors ) ){

        req.body.fund.rate = parseFloat( req.body.fund.rate );
        req.body.fund.amount = parseFloat( req.body.fund.amount );

        // See if target company exist
        Company.find( {
            where: [
                { account_number: req.body.fund.account_number }
            ]
        } ).done( function( err, company ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            //didnt find company
            else if( _.isEmpty( company ) ){
                res.send( 400, { errors: [ { 'fund.account_number': [ 'Cannot find target company' ] } ] } );
                return next();
            }
            else{
                // Check if account is valid along with currency it takes
                Account.find( {
                    where: [
                        { id: req.body.fund.account_id },
                        { company_id: req.user.company_id }
                    ],
                    include: [
                        { model: Currency }
                    ]
                } ).done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( account ) ){
                        res.send( 400, { errors: [ { 'fund.account_id': [ 'Invalid funding account' ] } ] } );
                        return next();
                    }
                    //when found check the interest rate
                    else{
                        if( req.body.fund.rate <= 0 || req.body.fund.rate > 100 ){
                            res.send( 400, { errors: [ { 'fund.rate': [ 'Invalid interest rate' ] } ] } );
                            return next();
                        }
                        //create a new fund
                        var newFund = Fund.build( {
                            nickname: req.body.fund.nickname,
                            account_id: req.body.fund.account_id,
                            currency_id: account.currency_id,
                            amount: req.body.fund.amount,
                            rate: req.body.fund.rate,
                            end_date: req.body.fund.end_date,
                            company_id: company.id,
                            investor_id: req.user.company_id,
                            notes: req.body.fund.notes
                        } );
                        //save the new fund
                        newFund.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    // Create account, deposit money(funds)
                                    var newAccount = Account.build( {
                                        currency_id: account.currency_id,
                                        fund_id: newFund.id,
                                        name: 'F-' + newFund.name,
                                        balance: 0,
                                        type: 1
                                    } );
                                    //save the account
                                    newAccount.save();

                                    logger.info( 'fund', 'created F-' + newFund.name + '[' + newFund.id + ']', {
                                        req: req
                                    } );
                                    //set newfund values tot he company, account, and currency id's
                                    res.send( 201, { fund: newFund } );
                                    return next();
                                }
                            } );
                    }
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.view = function( req, res, next ){

    req.assert( 'fund_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Fund.find( {
            where: [
                { id: req.params.fund_id },
                Sequelize.or(
                    { investor_id: req.user.company_id },
                    Sequelize.and(
                        { company_id: req.user.company_id },
                        { status: [ 1, 2 ] }
                    )
                )
            ]
        } ).done( function( err, fund ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            if( _.isEmpty( fund ) ){
                res.send( 404 );
                return next();
            }
            else{
                Account.find( {
                    where: [
                        { fund_id: fund.id }
                    ]
                } ).done( function( err, fundAccount ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        fund.values.sub_account_id = fundAccount.values.id;
                        var chainer = new Sequelize.Utils.QueryChainer;

                        chainer.add( Transaction.findAll( {
                            where: [
                                { from_account_id: fundAccount.id },
                                { to_account_id: fund.account_id },
                                { model: 'fund' },
                                { model_id: fund.id },
                                { type: 6 },
                                { status: [ 0, 1 ] }
                            ]
                        } ) );

                        chainer.runSerially().done( function( err, results ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                var investorWithdrawals = results[ 0 ];
                                var investorPreviouslyWithdrawn = 0;
                                _.forEach( investorWithdrawals, function( trans ){
                                    investorPreviouslyWithdrawn += trans.amount;
                                } );
                                fund.values.investor_withdrawal_amount = investorPreviouslyWithdrawn;

                                // Find associated projects
                                Node.findAll( {
                                    where: [
                                        { company_id: fund.company_id },
                                        { fund_id: fund.id },
                                        { status: 1 }
                                    ]
                                } ).done( function( err, nodes ){

                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        var chainer = new Sequelize.Utils.QueryChainer;
                                        var projects = [];
                                        fund.values.projects = [];

                                        _.forEach( nodes, function( node ){
                                            // Find Project
                                            chainer.add( Project.find( node.project_id ) );

                                            // Find Buyer
                                            chainer.add( Node.find( {
                                                where: [
                                                    { id: node.parent_id },
                                                    { status: [ 0, 1 ] }
                                                ]
                                            } ) );

                                            // Find Suppliers
                                            chainer.add( Node.findAll( {
                                                //attributes: ['id'],
                                                where: [
                                                    { parent_id: node.id },
                                                    { status: [ 0, 1 ] }
                                                ]
                                            } ) );

                                            fund.values.projects.push( node.project_id );
                                        } );

                                        chainer.runSerially().done( function( err, results ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{

                                                for( var i = 0; i < nodes.length; i++ ){
                                                    var nodeProject = results[ 3 * i + 0 ];

                                                    if( results[ 3 * i + 1 ] === null ){
                                                        nodeProject.values.bnode = null;
                                                    }
                                                    else{
                                                        nodeProject.values.bnode = results[ 3 * i + 1 ].id;
                                                    }

                                                    nodeProject.values.snodes = [];
                                                    for( var j = 0; j < results[ 3 * i + 2 ].length; j++ ){
                                                        nodeProject.values.snodes.push( results[ 3 * i + 2 ][ j ].id );
                                                    }


                                                    projects.push( nodeProject );
                                                }

                                                // Strip out info if not investor who is viewing
                                                if( fund.values.investor_id !== req.user.company_id ){
                                                    fund.values.notes = null;
                                                }

                                                res.send( 200, { fund: fund, projects: projects } );
                                                return next();
                                            }
                                        } );
                                    }
                                } );
                            }
                        } );
                    }
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.update = function( req, res, next ){
    req.assert( 'fund_id', 'isString' );
    req.assert( 'fund', 'isObject' );
    req.assert( 'fund.rate', 'isNumber' );
    req.assert( 'fund.amount', 'isNumber' );
    req.assert( 'fund.end_date', 'isDate' );
    if( _.isEmpty( req.validationErrors ) ){
        Fund.find( {
            where: [
                { id: req.params.fund_id },
                { investor_id: req.user.company_id }
            ]
        } ).done( function( err, fund ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( fund ) ){
                res.send( 404 );
                return next();
            }
            else if( fund.status !== 0 ){
                res.send( 400, { errors: [ 'Can only update draft funds.' ] } );
                return next();
            }
            else if( req.body.fund.rate <= 0 || req.body.fund.rate > 100 ){
                res.send( 400, { errors: [ { 'fund.rate': [ 'Invalid interest rate' ] } ] } );
                return next();
            }
            else{
                fund.values.nickname = req.body.fund.nickname;
                fund.values.amount = req.body.fund.amount;
                fund.values.rate = req.body.fund.rate;
                fund.values.end_date = req.body.fund.end_date;
                fund.values.notes = req.body.fund.notes;

                logger.info( 'fund', 'updated F-' + fund.name + '[' + fund.id + ']', {
                    req: req
                } );

                fund.save().then( function( fund ){
                    res.send( 200, { fund: fund } );
                    return next();
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.addProject = function( req, res, next ){
    req.assert( 'fund_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.project_name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Fund.find( {
            where: [
                { id: req.params.fund_id },
                { investor_id: req.user.company_id }
            ]
        } ).done( function( err, fund ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( fund ) ){
                res.send( 400, { errors: [ 'Cannot find fund' ] } );
                return next();
            }
            else{
                Project.find( {
                    where: [
                        { name: req.body.data.project_name.toUpperCase() }
                    ]
                } ).done( function( err, project ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( project ) ){
                        res.send( 400, { errors: [ 'Cannot find project' ] } );
                        return next();
                    }
                    else{
                        Node.find( {
                            where: [
                                { project_id: project.id },
                                { company_id: fund.company_id },
                                { allow_funding: 1 },
                                { status: 1 }
                            ]
                        } ).done( function( err, node ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( _.isEmpty( node ) ){
                                res.send( 400, { errors: [ 'Target company does not participate in the project.' ] } );
                                return next();
                            }
                            else{
                                // If node already has investment
                                if( !_.isEmpty( node.fund_id ) ){
                                    res.send( 400, { errors: [ 'The project has already been funded.' ] } );
                                    return next();
                                }

                                // Check currency type of project.
                                Account.find( fund.account_id ).done( function( err, account ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        if( account.currency_id != project.currency_id ){
                                            res.send( 400, { errors: [ 'The project uses a different currency' ] } );
                                            return next();
                                        }
                                        else{
                                            node.values.fund_id = fund.id;
                                            node.save().done( function( err, fund ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    res.send( 200, { status: 'ok' } );
                                                    return next();
                                                }
                                            } );
                                        }
                                    }
                                } );
                            }
                        } );
                    }
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.removeProject = function( req, res, next ){

    req.assert( 'fund_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.project_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Fund.find( {
            where: [
                { id: req.params.fund_id },
                { investor_id: req.user.company_id }
            ]
        } ).done( function( err, fund ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( fund ) ){
                res.send( 400, { errors: [ 'Cannot find fund' ] } );
                return next();
            }
            else{
                Project.find( {
                    where: [
                        { id: req.body.data.project_id }
                    ]
                } ).done( function( err, project ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( project ) ){
                        res.send( 400, { errors: [ 'Cannot find project' ] } );
                        return next();
                    }
                    else{
                        Node.find( {
                            where: [
                                { project_id: project.id },
                                { company_id: fund.company_id },
                                { allow_funding: 1 },
                                { status: 1 }
                            ]
                        } ).done( function( err, node ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( _.isEmpty( node ) ){
                                res.send( 400, { errors: [ 'Target company does not participate in the project.' ] } );
                                return next();
                            }
                            else{
                                // If node already has investment
                                if( _.isEmpty( node.fund_id ) ){
                                    res.send( 400, { errors: [ 'The project is not part of the fund.' ] } );
                                    return next();
                                }

                                // Check currency type of project.

                                node.values.fund_id = null;
                                node.save().done( function( err, fund ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 200, { status: 'ok' } );
                                        return next();
                                    }
                                } );

                            }
                        } );
                    }
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.send = function( req, res, next ){

    req.assert( 'fund_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Fund.find( {
            where: [
                { id: req.params.fund_id },
                { investor_id: req.user.company_id }
            ],
            include: [
                { model: Company },
                { model: Company, as: 'Investor' }
            ]
        } )
            .done( function( err, fund ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !fund ){
                    res.send( 404 );

                    logger.error( 'fund', 'attempting to send a fund that is not found  [' + req.params.fund_id + ']', {
                        req: req
                    } );

                    return next();
                }
                else if( fund.status !== 0 ){
                    res.send( 400, { errors: [ 'Only can send a draft fund' ] } );
                    return next();
                }
                else{
                    fund.status = 1;
                    Node.findAll( {
                        where: [
                            { fund_id: fund.id }
                        ]
                    } ).done( function( err, nodes ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( nodes ) ){
                            res.send( 400, { errors: [ 'Need a least one project to fund.' ] } );
                            return next();
                        }
                        else{
                            Account.find( {
                                where: [
                                    { id: fund.account_id },
                                    { company_id: fund.investor_id }
                                ],
                                include: [
                                    { model: Currency }
                                ]
                            } ).done( function( err, account ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( !account ){
                                    logger.error( 'fund', 'F-' + fund.name + '[' + req.params.fund_id + '] cannot use specified account.', {
                                        req: req
                                    } );
                                    res.send( 400, { errors: [ 'Cannot use the account specified' ] } );
                                    return next();
                                }
                                else{
                                    // Enough money?
                                    var fee = math.round( fund.amount * req.user.fee.getLoanRate(), 2 );
                                    if( account.balance < fee + fund.amount ){
                                        logger.error( 'fund', 'F-' + fund.name + '[' + req.params.fund_id + '] insufficient fund in the account.', {
                                            req: req
                                        } );
                                        res.send( 400, { errors: [ 'Insufficient fund in the specified account' ] } );
                                        return next();
                                    }
                                    else{
                                        Account.find( {
                                            where: [
                                                { fund_id: fund.id }
                                            ]
                                        } ).done( function( err, fundAccount ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else if( !fundAccount ){
                                                logger.error( 'fund', 'F-' + fund.name + '[' + req.params.fund_id + '] cannot find the account that belongs to the fund.', {
                                                    req: req
                                                } );
                                                res.send( 400, { errors: [ 'There are some problems with the settings of the fund.' ] } );
                                                return next();
                                            }
                                            else{
                                                // Take money for Fund and Fee
                                                account.balance -= fee;
                                                account.balance -= fund.amount;
                                                account.save().success( function(){


                                                    fund.save()
                                                        .done( function( err ){
                                                            if( !!err ){
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else{
                                                                res.send( 200, { fund: fund } );

                                                                notifier.notifyCompany( 'akx-fund-sent', fund.investor_id, { to_company_name: fund.company.name + ' (XYZ' + fund.company.account_number + ')', fund_name: 'F-' + fund.name }, req );
                                                                notifier.notifyCompany( 'akx-fund-received', fund.company_id, { from_company_name: fund.investor.name + ' (XYZ' + fund.investor.account_number + ')', fund_name: 'F-' + fund.name }, req );

                                                                logger.info( 'fund', 'F-' + fund.name + '[' + req.params.fund_id + '] status changed to 1 (sent & pending)', {
                                                                    req: req
                                                                } );

                                                                return next();
                                                            }
                                                        } );
                                                } );
                                                //} );
                                            }
                                        } )
                                    }
                                }
                            } );
                        }
                    } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.accept = function( req, res, next ){
    req.assert( 'fund_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Fund.find( {
            where: [
                { id: req.params.fund_id },
                { company_id: req.user.company_id }
            ],
            include: [
                { model: Company },
                { model: Company, as: 'Investor' }
            ]
        } )
            .done( function( err, fund ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !fund ){
                    res.send( 404 );
                    logger.error( 'fund', 'attempting to accept a fund that is not found [' + req.params.fund_id + ']', {
                        req: req
                    } );

                    return next();
                }
                else if( fund.status !== 1 ){
                    res.send( 400, { errors: [ 'Only can accept a pending fund' ] } );
                    return next();
                }
                else{
                    Account.find( {
                        where: [
                            { id: fund.account_id }
                        ],
                        include: [
                            { model: Currency }
                        ]
                    } ).done( function( err, account ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !account ){
                            res.send( 400, { errors: [ 'Could not find funding account.' ] } );
                            logger.error( 'fund', 'Could not find funding account [' + req.params.fund_id + ']', {
                                req: req
                            } );

                            return next();
                        }
                        else{
                            Account.find( {
                                where: [
                                    { fund_id: fund.id }
                                ],
                                include: [
                                    { model: Currency }
                                ]
                            } ).done( function( err, fundAccount ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( !fundAccount ){
                                    res.send( 400, { errors: [ 'Could not find fund account.' ] } );
                                    logger.error( 'fund', 'attempting to accept a fund that is not found [' + req.params.fund_id + ']', {
                                        req: req
                                    } );

                                    return next();
                                }
                                else{
                                    Node.findAll( {
                                        where: [
                                            { fund_id: fund.id }
                                        ],
                                        include: [
                                            { model: Node, as: 'snodes' }
                                        ]
                                    } ).done( function( err, nodes ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else if( _.isEmpty( nodes ) ){
                                            res.send( 400, { errors: [ 'No projects are associated with fund.' ] } );
                                            logger.error( 'fund', 'No projects are associated with fund [' + req.params.fund_id + ']', {
                                                req: req
                                            } );

                                            return next();
                                        }
                                        else{
                                            // Make sure no points out
                                            for( var i = 0; i < nodes.length; i++ ){
                                                for( var j = 0; j < nodes[ i ].snodes.length; j++ ){
                                                    if( nodes[ i ].snodes[ j ].points_cash !== 0 && nodes[ i ].snodes[ j ].points_cash !== 0 ){
                                                        res.send( 400, { errors: [ 'Projects cannot have cash pointed out in order to accept funding.' ] } );
                                                        logger.error( 'fund', 'Projects cannot have cash pointed out in order to accept funding. [' + req.params.fund_id + ']', {
                                                            req: req
                                                        } );
                                                        return next();
                                                    }
                                                }
                                            }

                                            // Change all projects' account_id to new account's ID
                                            var chainer = new Sequelize.Utils.QueryChainer;
                                            for( var i = 0; i < nodes.length; i++ ){
                                                chainer.add( nodes[ i ].save() );
                                            }

                                            chainer.runSerially().done( function( err, results ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    var fee = math.round( fund.amount * req.user.fee.getLoanRate(), 2 );

                                                    // Transactions
                                                    var fundTransaction = Transaction.build( {
                                                        currency_id: fund.currency_id,
                                                        from_account_id: fund.account_id,
                                                        to_account_id: fundAccount.id,
                                                        model: 'fund',
                                                        model_id: fund.id,
                                                        amount: fund.amount,
                                                        type: 6,
                                                        status: 1
                                                    } );

                                                    fundTransaction.save().done( function( err ){
                                                        if( !!err ){
                                                            _this.handleError( err, req, res );
                                                            return next();
                                                        }
                                                        else{
                                                            if( fee !== 0 ){
                                                                var feeTransaction = Transaction.build( {
                                                                    parent_id: fundTransaction.id,
                                                                    currency_id: fund.currency_id,
                                                                    from_account_id: fund.account_id,
                                                                    to_account_id: fundAccount.currency.fee_account_id,
                                                                    model: 'fund',
                                                                    model_id: fund.id,
                                                                    amount: fee,
                                                                    type: 3,
                                                                    status: 0
                                                                } );

                                                                feeTransaction.save();
                                                            }

                                                            fundAccount.values.balance = fund.amount;
                                                            fundAccount.save();

                                                            fund.values.status = 2;
                                                            fund.save().done( function( err, fund ){
                                                                if( !!err ){
                                                                    _this.handleError( err, req, res );
                                                                    return next();
                                                                }
                                                                else{
                                                                    res.send( 200, { fund: fund } );
                                                                    notifier.notifyCompany( 'akx-fund-accepted', fund.investor_id, { from_company_name: fund.company.name + ' (XYZ' + fund.company.account_number + ')', fund_name: 'F-' + fund.name }, req );
                                                                    logger.info( 'fund', 'F-' + fund.name + '[' + req.params.fund_id + '] status changed to 2 (accepted)', {
                                                                        req: req
                                                                    } );

                                                                    return next();
                                                                }
                                                            } );
                                                        }
                                                    } );
                                                }
                                            } );
                                        }
                                    } );
                                }
                            } );
                        }
                    } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.decline = function( req, res, next ){

    req.assert( 'fund_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Fund.find( {
            where: [
                { id: req.params.fund_id },
                { company_id: req.user.company_id }
            ],
            include: [
                { model: Company },
                { model: Company, as: 'Investor' }
            ]
        } )
            .done( function( err, fund ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !fund ){
                    res.send( 404 );
                    logger.error( 'fund', 'attempting to decline a fund that is not found [' + req.params.fund_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else if( fund.status !== 1 ){
                    res.send( 400, { errors: [ 'Only can decline a pending fund' ] } );
                    return next();
                }
                else{
                    var chainer = new Sequelize.Utils.QueryChainer;
                    chainer.add( Account.find( {
                        where: [
                            { id: fund.account_id }
                        ]
                    } ) );
                    chainer.add( Account.find( {
                        where: [
                            { fund_id: fund.id }
                        ]
                    } ) );
                    chainer.add( Node.findAll( {
                        where: [
                            { fund_id: fund.id }
                        ]
                    } ) );
                    chainer.add( Transaction.findAll( {
                        where: [
                            { from_account_id: fund.account_id },
                            { model: 'fund' },
                            { model_id: fund.id },
                            { status: 0 }
                        ]
                    } ) );

                    chainer.runSerially().done( function( err, results ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var account = results[ 0 ];
                            var fundAccount = results[ 1 ];
                            var nodes = results[ 2 ];
                            var transactions = results[ 3 ];

                            if( _.isEmpty( account ) ){
                                res.send( 400, { errors: [ 'Could not find funding account.' ] } );
                                logger.error( 'fund', 'Could not find funding account [' + req.params.fund_id + ']', {
                                    req: req
                                } );
                                return next();
                            }
                            else if( _.isEmpty( fundAccount ) ){
                                res.send( 400, { errors: [ 'Could not find fund account.' ] } );
                                logger.error( 'fund', 'Could not find fund account [' + req.params.fund_id + ']', {
                                    req: req
                                } );
                                return next();
                            }
                            else{
                                var chainer = new Sequelize.Utils.QueryChainer;
                                // Disassociated fund_id from projects
                                if( Array.isArray( nodes ) ){
                                    for( var i = 0; i < nodes.length; i++ ){
                                        nodes[ i ].values.fund_id = null;
                                        chainer.add( nodes[ i ].save() );
                                    }
                                }
                                else if( !_.isEmpty( nodes ) ){
                                    nodes.values.fund_id = null;
                                    chainer.add( nodes.save() );
                                }

                                // Cancel pending transactions
                                for( var i = 0; i < transactions.length; i++ ){
                                    transactions[ i ].values.status = 2;
                                    account.balance += transactions[ i ].amount;
                                    chainer.add( transactions[ i ].save() );
                                }

                                // Move take money back

                                account.balance += fund.amount;
                                //chainer.add( newTrans.save() );
                                chainer.add( account.save() );

                                fundAccount.company_id = null;
                                chainer.add( fundAccount.save() );

                                // Change fund status
                                fund.status = 0;
                                chainer.add( fund.save() );

                                chainer.runSerially().done( function( err, results ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 200, { fund: fund } );
                                        notifier.notifyCompany( 'akx-fund-declined', fund.investor_id, { from_company_name: fund.company.name + ' (XYZ' + fund.company.account_number + ')', fund_name: 'F-' + fund.name }, req );
                                        logger.info( 'fund', 'F-' + fund.name + '[' + req.params.fund_id + '] was declined, status changed to 0 (draft)', {
                                            req: req
                                        } );
                                        return next();
                                    }
                                } );
                            }
                        }
                    } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.withdraw = function( req, res, next ){
    req.assert( 'fund_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.amount', 'isNumber' );
    req.assert( 'data.account_id', 'isString' );

    Fund.find( {
        where: [
            { id: req.params.fund_id },
            Sequelize.or(
                { investor_id: req.user.company_id },
                { company_id: req.user.company_id }
            )
        ]
    } ).done( function( err, fund ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !fund ){
            res.send( 404 );
            logger.error( 'fund', 'attempting to withdraw from a fund that is not found [' + req.params.fund_id + ']', {
                req: req
            } );
            return next();
        }
        else if( fund.status !== 2 && fund.status !== 3 ){
            res.send( 400, { errors: [ 'Only can withdraw from an active fund' ] } );
            return next();
        }
        else if( req.body.data.amount <= 0 ){
            res.send( 400, { errors: [ 'Invalid amount' ] } );
            return next();
        }
        else if( moment.utc() < fund.end_date ){
            res.send( 400, { errors: [ 'Fund mature date not reached yet.' ] } );
            return next();
        }
        else{
            // Is investor
            if( fund.investor_id === req.user.company_id ){
                fund.values.isInvestor = true;
            }
            else{
                fund.values.isInvestor = false;
            }

            var chainer = new Sequelize.Utils.QueryChainer;
            chainer.add( Account.find( {
                where: [
                    { id: req.body.data.account_id }
                ]
            } ) );

            chainer.add( Account.find( {
                where: [
                    { fund_id: fund.id }
                ]
            } ) );

            chainer.runSerially().done( function( err, results ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var toAccount = results[ 0 ];
                    var fundAccount = results[ 1 ];
                    var chainer = new Sequelize.Utils.QueryChainer;

                    if( _.isEmpty( toAccount ) ){
                        res.send( 400, { errors: [ 'Could not find funding account.' ] } );
                        logger.error( 'fund', 'Could not find funding account [' + req.params.fund_id + ']', {
                            req: req
                        } );
                        return next();
                    }
                    else if( _.isEmpty( fundAccount ) ){
                        res.send( 400, { errors: [ 'Could not find fund account.' ] } );
                        logger.error( 'fund', 'Could not find fund account [' + req.params.fund_id + ']', {
                            req: req
                        } );
                        return next();
                    }

                    // All investor's withdrawals
                    chainer.add( Transaction.findAll( {
                        where: [
                            { from_account_id: fundAccount.id },
                            { to_account_id: fund.account_id },
                            { model: 'fund' },
                            { model_id: fund.id },
                            { type: 6 },
                            { status: [ 0, 1 ] }
                        ]
                    } ) );

                    chainer.runSerially().done( function( err, results ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var investorWithdrawals = results[ 0 ];

                            var interest = math.round( fund.amount * fund.rate / 100, 2 );
                            var investorPreviouslyWithdrawn = 0;

                            _.forEach( investorWithdrawals, function( trans ){
                                investorPreviouslyWithdrawn += trans.amount;
                            } );

                            var available = 0;
                            if( fund.values.isInvestor ){
                                available = Math.min( fundAccount.balance, Math.min( req.body.data.amount, fund.amount + interest - investorPreviouslyWithdrawn ) );
                            }
                            else{
                                available = Math.max( 0, fundAccount.balance - ( fund.amount + interest - investorPreviouslyWithdrawn ) );
                            }

                            if( req.body.data.amount > available ){
                                res.send( 400, { errors: [ 'Insufficient balance in the fund account' ] } );
                                logger.error( 'fund', 'Insufficient balance in the fund account [' + req.params.fund_id + ']', {
                                    req: req
                                } );
                                return next();
                            }
                            else{
                                // Deduct the amount and save
                                fundAccount.values.balance -= req.body.data.amount

                                // Create transaction
                                var fundTransaction = Transaction.build( {
                                    currency_id: fund.currency_id,
                                    from_account_id: fundAccount.id,
                                    to_account_id: toAccount.id,
                                    model: 'fund',
                                    model_id: fund.id,
                                    amount: req.body.data.amount,
                                    type: 6,
                                    status: 0
                                } );

                                fundAccount.save().done( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        fundTransaction.save().done( function( err ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                res.send( 200, { status: 'ok' } );
                                                logger.info( 'fund', 'Withdrew ' + req.body.data.amount + ' from F-' + fund.name + '[' + req.params.fund_id + ']', {
                                                    req: req
                                                } );
                                                return next();
                                            }
                                        } );
                                    }
                                } );
                            }
                        }
                    } );
                }
            } );
        }
    } );
}
