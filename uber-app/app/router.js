import Ember from 'ember';
import config from 'uber-app/config/environment';

var Router = Ember.Router.extend( {
    location: config.locationType
} );

Router.map( function(){
    this.route( 'root', { path: '/' } );

    this.route( 'dashboard', function(){
        this.route( 'pending-out', function(){
            this.route( 'view', { path: '/wires/:wire_id' } );
            this.route( 'view-batch', { path: '/wire-batches/:wire_batch_id' } );
        } );
        this.route( 'pending-in', function(){
            this.route( 'view', { path: ':wire_id' } );
        } );
        this.route( 'hold-out', function(){
            this.route( 'view', { path: ':wire_id' } );
        } );
        this.route( 'hold-in', function(){
            this.route( 'view', { path: ':wire_id' } );
        } );
        this.route( 'wire-summary', function(){
            this.route( 'view', { path: '/wires/:wire_id' } );
            this.route( 'view-batch', { path: 'wire-batches/:wire_batch_id' } );
        } );
        this.route( 'pending-commission-payments', function(){
            this.route( 'view', { path: 'payments/:commission_payment_id' } );
        } );
        this.route( 'fx-requests', function(){
            this.route( 'view', { path: ':fx_request_id' } );
        } );
        this.route( 'ach-recall', function(){
            this.route( 'view', { path: ':wire_id' } );
        } );
        this.route( 'queue', function(){
            this.route( 'view', { path: ':wire_id' } );
        } );
    } );

    this.route( 'affiliates', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'preview', { path: ':affiliate_id/preview' } );
        } );
        this.route( 'commissions', function(){
            this.route( 'view', { path: ':commission_id' } );
        } );
        this.route( 'payments', function(){
            this.route( 'view', { path: ':commission_payment_id' } );
        } );
    } );

    this.resource( 'fx-requests', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':fx_request_id' }, function(){
            } );
        } );
    } );

    this.route( 'mine', function(){
        this.route( 'tickets', { path: '/tickets' }, function(){
            this.route( 'view', { path: ':ticket_id' } );
        } );
        this.route( 'uber-tasks', { path: '/tasks' }, function(){
            this.route( 'view', { path: ':task_id' } );
        } );
    } );

    this.resource( 'companies', function(){
        this.route( 'view', { path: ':company_id' }, function(){
            this.route('company-documents',{ path: '/company-documents' }, function(){
                this.route('view', { path: ':uber_document_id' });
                this.route('add');
            } );
            this.route( 'fees', { path: '/fees' }, function(){
                this.route( 'edit' );
            } );
            this.route( 'wire-instructions', { path: '/wire-instructions' }, function(){
                this.route('add');
                this.route( 'view', { path: ':wire_instruction_id' } );
            } );
            this.route( 'users', { path: '/users' }, function(){
                this.route( 'add' );
                this.route( 'view', { path: ':user_id' }, function(){
                    this.route( 'access-logs', { path: '/access-logs' }, function(){
                        this.route( 'view', { path: ':access_log_id' } );
                    } );
                    this.route( 'uber-pwned', { path: '/uber-pwned' }, function(){
                        this.route( 'pwned', { path: ':uber_pwned_id' } );
                    } );
                    this.route( 'locks' );
                    this.route( 'add-lock' );
                    this.route( 'verifications', { path: '/verifications' }, function(){
                        this.route( 'add' );
                    } );
                    this.route( 'security-questions', { path: '/security-questions' }, function(){
                        this.route( 'add' );
                    } );
                } );
            } );
            this.route( 'institution-users', { path: '/institution-users' }, function(){
                this.route( 'view', { path: ':institution_user_id' }, function(  ){
                    this.route( 'verifications', { path: '/verifications' }, function(){
                        this.route( 'add' );
                    } );
                } );
                this.route( 'add' );
            } );

            this.route( 'invoices', function(){
                this.route( 'index', { path: '' }, function(){
                    this.route( 'view', { path: ':invoice_id' } );
                    //this.route( 'view-draft', { path: ':invoice_id/edit' } );
                } );
                this.route( 'bills', { path: 'bills' }, function(){
                    this.route( 'view', { path: ':invoice_id' } );
                } );

            } );

            this.route( 'company-relationships', { path: '/company-relationships' }, function(){
                this.route( 'view', { path: ':company_relationship_id' } );
                this.route( 'add' );
            } );

            this.route( 'wires', { path: '/wires' }, function(){
                this.route( 'download' );
                this.route( 'view', { path: ':wire_id' }, function(){
                    this.route( 'return', { path: '/return' } );
                } );
                this.route( 'wirein' );
                this.route( 'wireout' );
                this.route( 'book-transfer' );
                this.route( 'internal-account' );
            } );

            this.route( 'wire-templates', { path: '/wire-templates' }, function(){
                this.route( 'view', { path: ':wire_template_id' } );
                this.route( 'add' );
            } );

            this.route( 'accounts', { path: '/accounts' }, function(){
                this.route( 'add' );
                this.route( 'view', { path: ':account_id' }, function(){
                    this.route( 'edit' );
                    this.route( 'download' );
                    this.route( 'hold' );
                    this.route( 'fee-refund' );
                    this.route( 'transactions', function(){
                        this.route( 'view', { path: ':transaction_id' } );
                    } );
                } );
            } );

            this.route( 'account-aliases', { path: '/account-aliases' }, function(){
                this.route( 'add' );
                this.route( 'view', { path: ':account_alias_id' } );
            } );

            this.route( 'tasks', { path: '/tasks' }, function(){
                this.route( 'add' );
                this.route( 'view', { path: ':task_id' } );
            } );

            this.route( 'fx-requests', { path: '/fx-requests' }, function(){
                this.route( 'add' );
                this.route( 'view', { path: ':fx_request_id' } );
            } );

            this.route( 'documents', function(){
                this.route( 'platform-documents', function(){
                    this.route( 'view', { path: ':document_id' } );
                } );
                this.route( 'uber-documents', function(){
                    this.route( 'view', { path: ':uber_document_id' } );
                } );
            } );
            this.route( 'due-diligence', { path: '/due-diligence' }, function(){
                this.route( 'add' );
                this.route( 'view', { path: ':uber_due_diligence_id' } );
            } );

            this.route( 'tickets', function(){
                this.route( 'add' );
                this.route( 'view', { path: ':ticket_id' } );
            } );

            this.route( 'commissions', function(){
                this.route( 'overview' );
                this.route( 'add' );
                this.route( 'view', { path: ':commission_id' } );
                this.route( 'payments', function(){
                    this.route( 'view', { path: ':commission_payment_id' } );
                } );
            } );

            this.route( 'charges', function(){
                this.route( 'view', { path: ':charge_id' }, function(){
                    this.route( 'edit' );
                } );
                this.route( 'add' );
            } );

            this.route( 'info-requests', { path: '/info-requests' }, function(){
                this.route( 'view', { path: ':info_request_id' } );
                this.route( 'add' );
            } );

            this.route( 'uber-sar-reports', { path: '/uber-sar-reports' } );
        } );
    } );

    this.resource( 'registrations', function(){
        this.route( 'view', { path: ':registration_id' }, function(){
            this.route( 'info' );
            this.route( 'owners' );
            this.route( 'questionnaire' );
            this.route( 'agreement' );
            this.route( 'verification', function(){
                this.route( 'view-document-modal', { path: 'view-document-modal/:sub_document_id' } );
                this.route( 'view-document', { path: 'view-document/:sub_document_id' } );
                this.route( 'view-exemption', { path: 'view-exemption/:sub_document_id' } );
                this.route( 'add-document' );
            } );
            this.route( 'complete' );
            this.route( 'impersonate' );
        } );

        this.route( 'index', function(){
            this.route( 'preview', { path: ':registration_id/preview' } );
        } );
    } );

    this.resource( 'wires', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'download' );
            this.route( 'view', { path: ':wire_id' }, function(){
                this.route( 'return', { path: '/return' } );
            } );
        } );
        this.route( 'wirein' );
        this.route( 'wireout' );
        this.route( 'internal' );
    } );

    this.resource( 'projects', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':project_id' }, function(){
            } );
        } );
    } );

    this.resource( 'wire-batches', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':wire_batch_id' } );
        } );
    } );

    this.resource( 'authenticators', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'add', { path: 'add' } );
            this.route( 'view', { path: ':authenticator_id' } );
        } );
    } );

    this.resource( 'uber-users', function(){
        this.route( 'view' );
    } );


    this.resource( 'announcements', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'add' );
            this.route( 'view', { path: ':announcement_id' } );
        } );
    } );

    this.resource( 'wire-instructions', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':wire_instruction_id' } );
        } );
    } );

    this.resource( 'tickets', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':ticket_id' } );
        } );
    } );

    this.resource( 'uber-tasks', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':task_id' }, function(){
            } );
        } );
    } );

    this.resource( 'uber-pwned', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':uber_pwned_id' }, function(){
            } );
        } );
    } );

    this.resource( 'uber-email-templates', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'add' );
            this.route( 'view', { path: ':uber_email_template_id' }, function(){
            } );
        } );
    } );

    this.resource( 'access-logs', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':access_log_id' }, function(){
            } );
        } );
    } );

    this.route( 'uber-sar-reports', { path: '/uber-sar-reports' }, function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'view', { path: ':uber_sar_report_id' }, function(){
                this.route( 'uber-sar-submissions', { path: '/uber-sar-submissions' }, function(){
                    this.route( 'view', { path: ':uber_sar_submission_id' } );
                    this.route( 'add' );
                } );
            } );
            this.route( 'add' );
        } );

    } );

    this.resource( 'account-aliases', function(){
        this.route( 'index', function(){
            this.route( 'view', { path: ':account_alias_id' } );
        } );
    } );

    this.resource( 'account-alias-rules', function(){
        this.route( 'index', { path: '' }, function(){
            this.route( 'add' );
            this.route( 'view', { path: ':account_alias_rule_id' } );
        } );
    } );

    this.route( 'analytics' );
    this.route( 'login' );
    this.route( 'forgot' );
    this.route( 'password-reset' );
    this.route( 'search', { path: '/search/:value' } );

    this.resource( 'sweeps', function(){
        this.route( 'index' );
    } );

    this.resource( 'uber-user-caches', function(){
        this.route( 'index' );
    } );

    this.resource( 'uber-monitoring-rules', function(){
        this.route( 'index',  { path: '' }, function(){
            this.route( 'add' );
            this.route( 'view', { path: ':uber_mon_rule_id' } );
        } );
    } );
} );

export default Router;
