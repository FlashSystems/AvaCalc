/**
 * jQuery file download v0.1
 *
 * Save file in Browser 
 * 
 * https://github.com/toohamster/jquery-savefile
 *
 * @author toohamster, 2016
 * @license Apache License Version 2.0
 */
(function($) {
    'use strict';

    function saveAs(uri, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link); // Firefox requires the link to be in the body
            link.download = filename;
            link.href = uri;
            link.click();
            document.body.removeChild(link); // remove the link when done
        } else {
            location.replace(uri);
        }
    }

    $.savefile = {
        url: function(url, filename)
        {
            saveAs(url, filename);
        },
        file: function(mimetype, filename, data)
        {
            var data = 'data:' + mimetype + ';base64,' + window.btoa( unescape(encodeURIComponent(data)) );
            saveAs(data, filename);
        }
    };
    

}(jQuery));