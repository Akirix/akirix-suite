var fs = require( 'fs' );
var Handlebars = require( 'handlebars' );
var _ = require( 'lodash' );

const templatePath = __dirname + '/../templates_html';

module.exports = function(){
    Handlebars.registerHelper( 'compiled', function( content ){
        var template = Handlebars.compile( content.hash.content );
        var compiledTemplate = template( content.data.root );
        return new Handlebars.SafeString( compiledTemplate );
    } );

    Handlebars.registerHelper( 'email-wrapper', function( content ){
        var html =
            '<div bgcolor="" marginheight="0" marginwidth="0" style="width:100%!important;"><table bgcolor="" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody>' +
            content.fn() +
            '</tbody></table></div>';
        return new Handlebars.SafeString( html );
    } );

    Handlebars.registerHelper( 'email-content', function( content ){
        var html =
            '<tr><td align="center"><table width="680" border="0" cellpadding="0" cellspacing="0"><tbody>' +

            '<tr><td colspan="3" height="28"></td></tr>' +

            '<tr><td width="40"></td>' +
            '<td width="600" style="font-family:Avenir,Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;color:#424242;text-align:center;">' + content.fn() + '</td>' +
            '<td width="40"></td></tr>' +

            '<tr><td colspan="3" height="28"></td></tr>' +

            '</tbody></table></td></tr>';
        return new Handlebars.SafeString( html );
    } );

    Handlebars.registerHelper( 'row', function( content ){
        var html = '<tr><td>' + content.fn() + '</td></tr>';
        return new Handlebars.SafeString( html );
    } );

    Handlebars.registerHelper( 'hr-row', function( content ){
        return new Handlebars.SafeString( '<tr><td style="border-top: 1px dotted #cccccc;"></td></tr>' );
    } );

    Handlebars.registerHelper( 'table-row', function( content ){
        var rowStyle = '';
        if( !_.isEmpty( content.hash ) && _.isNumber( content.hash.key ) ){
            if( content.hash.key % 2 === 1 ){
                rowStyle += 'background-color:#f5f5f5;';
            }
        }
        var html = '<tr style="' + rowStyle + '">' + content.fn() + '</tr>';
        return new Handlebars.SafeString( html );
    } );

    Handlebars.registerHelper( 'spacer', function( content ){
        var size = 20;
        if( _.isNumber( content.hash.size ) ){
            size = content.hash.size;
        }
        return new Handlebars.SafeString( '<tr><td height="' + size + '"></td></tr>' );
    } );

    Handlebars.registerHelper( 'link', function( content ){
        var target = '_blank';
        if( _.isString( content.hash.target ) ){
            target = content.hash.target;
        }

        return new Handlebars.SafeString( '<a href="' + content.hash.href + '" target="' + target + '" style="text-decoration:none;color:#27a6e1">' + content.fn() + '</a>' );
    } );

    Handlebars.registerHelper( 'button-link', function( content ){
        return new Handlebars.SafeString( '<a href="' + content.hash.href + '" style="background-color:#21aefe;border-radius:3px;color:#ffffff;display:inline-block;font-family:Arial,sans-serif;font-size:16px;line-height:48px;text-align:center;letter-spacing:normal;text-decoration:none;font-weight:normal;padding-left:30px;padding-right:30px;cursor:cursor;text-transform:uppercase;" target="_blank">' + content.fn() + '</a>' );
    } );

    Handlebars.registerHelper( 'new-button', function( content ){
        return new Handlebars.SafeString( '<a href="' + content.hash.href + '" style="background-color:#175989;border-radius:5px;color:#ffffff;display:inline-block;font-family:sans-serif,Arial;font-size:12px;line-height:35px;text-align:center;letter-spacing:normal;text-decoration:none;font-weight:100;padding-left:30px;padding-right:30px;cursor:pointer;box-shadow:2px 3px 9px grey;" target="_blank">' + content.fn() + '</a>' );
    } );

    Handlebars.registerHelper( 'sign-off', function(){
        return new Handlebars.SafeString( '<tr><td height="40"></td></tr><tr><td>Thanks,</td></tr><tr><td height="8"></td></tr><tr><td><span>The Team</span><br><span><a href="https://www.xxx.com" target="_blank" style="text-decoration:none;color:#27a6e1">www.xxx.com</a></span></td></tr>' );
    } );

    Handlebars.registerHelper( 'new-sign-off', function(){
        return new Handlebars.SafeString( '<tr><td height="40"></td></tr><tr><td style="color:#777777;">Best Regards,</td></tr><tr><td><span style="color:#777777;">Support Team</span></td></tr><tr><td height="40"><span><a href="https://www.xxx.com" target="_blank" style="text-decoration:none;color:#27a6e1">www.xxx.com</a></span></td></tr>' );
    } );

    Handlebars.registerHelper( 'registration-name', function( content ){
        var html = '';
        if( !_.isEmpty( content ) ){
            if( content.account_type === 'business' ){
                html = '<span style="font-size: 18px;">' + content.company.name + '</span><br><span style="color: #777;">' + content.user.first_name + ' ' + content.user.last_name + '</span>';
            }
            else{
                html = '<span style="font-size: 18px;">' + content.user.first_name + ' ' + content.user.last_name + '</span>';
            }
        }

        return new Handlebars.SafeString( html );
    } );

    Handlebars.registerHelper( 'formatted-date', function( content ){
        var html = '';
        var date = moment( content.hash.date );
        var format = 'YYYY-MM-DD HH:mm:ss';

        if( _.isString( content.hash.format ) ){
            format = content.hash.format;
        }

        if( date.isValid() ){
            html = date.format( format );
        }

        return new Handlebars.SafeString( html );
    } );

    fs.readdirSync( __dirname + '/../templates_html/base' )
        .forEach( function( file ){
            var partialContent = fs.readFileSync( templatePath + '/base/' + file, { encoding: 'utf8' } );
            var partialName = file.split( '.' )[ 0 ];
            Handlebars.registerPartial( partialName, partialContent )
        } );

};