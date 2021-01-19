import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'div',

    title: "",

    defaultTitle: "Unclassified Activity",

    activityTypes: [
        { label: 'Structuring', val: "structuring" },
        { label: 'Terrorist Financing', val: "terroristFinancing" },
        { label: 'Fraud', val: "fraud" },
        { label: 'Gaming Activities', val: "gamingActivities" },
        { label: 'Money Laundering', val: "moneyLaundering" },
        { label: 'Identification / Documentation', val: "identificationDocumentation" },
        { label: 'Other Suspicious Activities', val: "otherSuspiciousActivities" },
        { label: 'Insurance', val: "insurance" },
        { label: 'Securities/Futures/Options', val: "securitiesFuturesOptions" },
        { label: 'Mortgage Fraud', val: "mortgageFraud" },
        { label: 'Cyber Event', val: "cyberEvent" }
    ],

    activitySubtypes: {
        structuring: [
            { label: 'Alters or cancels transaction to avoid BSA recordkeeping requirement', val: '11' },
            { label: 'Alters or cancels transaction to avoid CTR requirement', val: '12' },
            { label: 'Suspicious inquiry by customer regarding BSA reporting or recordkeeping requirements', val: '06' },
            { label: 'Transaction(s) below BSA recordkeeping threshold', val: '13' },
            { label: 'Transaction(s) below CTR threshold', val: '14' },
            { label: 'Other', val: '999' }
        ],
        terroristFinancing: [
            { label: "Known or suspected terrorist/terrorist organization", val: "01" },
            { label: "Other", val: "999" }
        ],
        fraud: [
            { label: 'ACH', val: '20' },
            { label: 'Advance fee', val: '22' },
            { label: 'Business loan', val: '21' },
            { label: 'Check', val: '01' },
            { label: 'Consumer Loan', val: '04' },
            { label: 'Credit/Debit Card', val: '05' },
            { label: 'Healthcare/Public or private health insurance', val: '23' },
            { label: 'Mail', val: '08' },
            { label: 'Mass-marketing', val: '09' },
            { label: 'Ponzi scheme', val: '24' },
            { label: 'Pyramid scheme', val: '10' },
            { label: 'Securities fraud', val: '25' },
            { label: 'Wire transfer', val: '12' },
            { label: 'Other', val: '999' }
        ],
        gamingActivities: [
            { label: 'Chip walking', val: '01' },
            { label: 'Minimal gaming with large transactions', val: '02' },
            { label: 'Suspicious use of counter checks or markers', val: '03' },
            { label: 'Unknown source of chips', val: '04' },
            { label: 'Other', val: '999' }
        ],
        moneyLaundering: [
            { label: 'Exchanges small bills for large bills or vice versa', val: '01' },
            { label: 'Funnel account', val: '24' },
            { label: 'Suspicion concerning the physical condition of funds', val: '20' },
            { label: 'Suspicion concerning source of funds', val: '21' },
            { label: 'Suspicious designation of beneficiaries, assignees, or joint owners', val: '04' },
            { label: 'Suspicious EFT/wire transfers', val: '05' },
            { label: 'Suspicious exchange of currencies', val: '22' },
            { label: 'Suspicious receipt of government payments/benefits', val: '06' },
            { label: 'Suspicious use of multiple accounts', val: '07' },
            { label: 'Suspicious use of noncash monetary instruments', val: '08' },
            { label: 'Suspicious use of third-party transactors (straw-man)', val: '09' },
            { label: 'Trade Based Money Laundering/ Black Market Peso Exchange', val: '23' },
            { label: 'Transactions out of pattern for customer(s)', val: '12' },
            { label: 'Other', val: '999' }
        ],
        identificationDocumentation: [
            { label: "Changes spelling or arrangement of name", val: "01" },
            { label: "Multiple individuals with same or similar identities", val: "02" },
            { label: "Provided questionable or false documentation", val: "03" },
            { label: "Provided questionable or false identification", val: "09" },
            { label: "Refused or avoided request for documentation", val: "04" },
            { label: "Single individual with multiple identities", val: "05" },
            { label: "Other", val: "999" }
        ],
        otherSuspiciousActivities: [
            { label: "Account takeover", val: "20" },
            { label: "Bribery or gratuity", val: "01" },
            { label: "Counterfeit instrument", val: "17" },
            { label: "Elder financial exploitation", val: "21" },
            { label: "Embezzlement/theft/disappearance of funds", val: "03" },
            { label: "Forgeries", val: "04" },
            { label: 'Human smuggling', val: '26' },
            { label: 'Human trafficking', val: '27' },
            { label: "Identity theft", val: "05" },
            { label: "Little or no concern for product performance penalties, fees, or tax consequences", val: "22" },
            { label: "Misuse of position or self-dealing", val: "24" },
            { label: "Suspected public/private corruption (domestic)", val: "07" },
            { label: "Suspected public/private corruption (foreign)", val: "08" },
            { label: "Suspicious use of informal value transfer system", val: "09" },
            { label: "Suspicious use of multiple transaction locations", val: "10" },
            { label: "Transaction with no apparent economic, business, or lawful purpose", val: "25" },
            { label: "Two or more individuals working together", val: "11" },
            { label: "Unlicensed or unregistered MSB", val: "13" },
            { label: "Other", val: "999" }
        ],
        insurance: [
            { label: 'Excessive insurance', val: '01' },
            { label: 'Excessive or unusual cash borrowing against policy/annuity', val: '02' },
            { label: 'Proceeds sent to unrelated third party', val: '04' },
            { label: "Suspicious life settlement sales insurance (e.g., STOLI's, Viaticals)", val: '05' },
            { label: 'Suspicious termination of policy or contract', val: '06' },
            { label: 'Unclear or no insurable interest', val: '07' },
            { label: 'Other', val: '999' }
        ],
        securitiesFuturesOptions: [
            { label: 'Insider trading', val: '01' },
            { label: 'Market manipulation', val: '08' },
            { label: 'Misappropriation', val: '03' },
            { label: 'Unauthorized pooling', val: '04' },
            { label: 'Wash trading', val: '09' },
            { label: 'Other', val: '999' }
        ],
        mortgageFraud: [
            { label: 'Application fraud', val: '05' },
            { label: 'Appraisal fraud', val: '01' },
            { label: 'Foreclosure/Short sale fraud', val: '06' },
            { label: 'Loan Modification fraud', val: '03' },
            { label: 'Origination fraud', val: '07' },
            { label: 'Other', val: '999' }
        ],
        cyberEvent: [
            { label: 'Against financial institution(s)', val: '01' },
            { label: 'Against financial institution customer(s)', val: '02' },
            { label: 'Other', val: '999' }
        ]
    },

    selectableActivitySubtypes: [],

    otherSubtype: false,

    init: function(){
        this._super();
        this.activityTypeWatcher( true );
        this.activitySubtypeWatcher( true );
        this.setTitle();
    },

    setTitle: function(){
        var type = this.get( 'activity.activityType' );
        var subtype = this.get( 'activity.activitySubtype' );
        var otherSubtype = this.get( 'activity.subtypeDescription' );
        var typeLabel = this.findTypeLabel( type );
        var subtypeLabel = this.findSubtypeLabel( type, subtype ) ;

        if( !!type ) {
            if( !!subtype ){
                if( subtype === "999" ){
                    if ( !!otherSubtype ) {
                        this.set( 'title', otherSubtype + " Activity" );
                    }
                    else{
                        this.set( 'title', "Other " + typeLabel + " Activity" );
                    }
                }
                else {
                    this.set( 'title', subtypeLabel + " Activity" );
                }
            }
            else{
                this.set( 'title', typeLabel + " Activity" );
            }
        }
        else{
            this.set( 'title', this.get( 'defaultTitle' ) );
        }
    }.observes( 'activity.activitySubtype', 'activity.activityType', 'activity.subtypeDescription' ),

    findTypeLabel: function( val ){
        var label = null;
        this.get( 'activityTypes' ).forEach( function( type ){
            if( type.val === val ){
                label = type.label
            }
        } );
        return label;
    },

    findSubtypeLabel: function( type, val ){
        var label = null;
        var activitySubtypes = this.get( 'activitySubtypes' );
        if( Ember.isArray( activitySubtypes[ type ] ) ) {
            activitySubtypes[ type ].forEach( function( subtype ) {
                if ( subtype.val === val ) {
                    label = subtype.label
                }
            } );
        }
        return label;
    },

    activityTypeWatcher: function( init ){
        var selectedActivityType = this.get( 'activity.activityType' );
        if( !!selectedActivityType ) {
            var selectableActivitySubtypes = this.get( 'activitySubtypes' )[ selectedActivityType ];
            if( init !== true ) {
                this.set( 'activity.activitySubtype', "" );
            }
            this.set( 'selectableActivitySubtypes', selectableActivitySubtypes );
        }
        else {
            this.set( 'activity.activitySubtype', "" );
            this.set( 'selectableActivitySubtypes', [] );
        }
    }.observes( 'activity.activityType' ),

    activitySubtypeWatcher: function( init ){
        if( this.get( 'activity.activitySubtype' ) === "999" ){
            if( init !== true ) {
                this.set( 'activity.subtypeDescription', "" );
            }
            this.set( 'otherSubtype', true );
        }
        else{
            this.set( 'otherSubtype', false );
        }
    }.observes( 'activity.activitySubtype' ),

    actions: {
        togglePanel: function( activityId, subjectId ){
            var panelToggle = $( document ).find( "a[data-target='#activity-" + activityId + "-subject-" + subjectId + "']" );
            var panel = $( document ).find( "#activity-" + activityId + "-subject-" + subjectId );
            var target = panelToggle.next();
            if( !panel.hasClass( 'collapsing' ) ) {
                if ( panel.hasClass( 'in' ) ) {
                    target.find( ".fa-chevron-up" ).replaceWith( '<i class="fa fa-chevron-down pull-right"></i>' );
                }
                else {
                    target.find( ".fa-chevron-down" ).replaceWith( '<i class="fa fa-chevron-up pull-right"></i>' );
                }
            }
            panelToggle.click();
        },
        addSubject: function(){
            var subject = { company: { id: null } };
            this.get( 'uberSarReport.addedSubjects' ).pushObject( subject );
            this.get( 'activity.subjects' ).pushObject( subject );
        },

        deleteSubject: function( subject ){
            this.get( 'activity.subjects' ).removeObject( subject );
            this.get( 'uberSarReport' ).removeExtraSubjects();
        }
    }
} );
