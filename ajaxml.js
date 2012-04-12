/**
 * @author Sam Atawy
 * (c) Accorpa Ltd. Egypt. 2011
 *
 * This library needs to use jQuery.js
 * It requires jquery.hashchange to control browser history.
 *
 */

var ajaxHourglass = 'Loading <img src="ajax-bar-loader.gif"/>';
var ajaxErrorMessage = 'Sorry. Your request could not completed.';

/*
 * Utility function.
 * 
 * You will not need to call this yourself.
 */
function decode(url) {
     if ((url != undefined) && (url != null)) {
	 	return unescape(url.replace(/\+/g, " "));
	 }
}

/*
 * Utility function that adds a parameter to a URL properly.
 * 
 * You will not need to call this yourself.
 */
function append2URL(url, param, value) {
	var app = param+"="+value;
	url = decode( url );
	
    if ((url != undefined) && (url != null)) {
		return url + (url.indexOf('?') != -1 ? "&" + app : "?" + app);
	} else {
		//exit
	}	
}

function setBinder(el){
	$(el).attr('bind', Math.round(Math.random(1000000)*1000000000));
}

function evalOnLoad(sender, targetid, data){
	var js = sender.attr('onLoad');
	var modified;
	
	if (typeof eval(js) == 'function') {
		eval('modified=' + js + "(unescape(data), sender.attr('id'),targetid)");
	} else {
		modified = data;
	}
	return modified;
}

function evalOnStart(sender, targetid){
	var js = sender.attr('onStart');
	var senderid = sender.attr('id');
	if (!senderid || (senderid == 'self')) senderid = targetid;
	
	if (typeof eval(js) == 'function') {
		eval( js + "(senderid,targetid)");
	}	
}

function evalOnComplete(sender, targetid){
	var js = sender.attr('onComplete');
	var senderid = sender.attr('id');
	if (!senderid || (senderid == 'self')) senderid = targetid;
	
	if (typeof eval(js) == 'function') {
		eval( js + "(senderid,targetid)");
	}	
}

function evalOnError(sender, targetid, jqXHR, textStatus, errorThrown){
	var js = sender.attr('onError');
	var senderid = sender.attr('id');
	if (!senderid || (senderid == 'self')) senderid = targetid;
	
	if (typeof eval(js) == 'function') {
		eval( js + "(senderid,targetid,jqXHR.status,jqXHR.statusText,jqXHR.responseText)");
	}	
}

/*
 * This is the main function called whenever an ajaxified link is clicked
 * 
 * It calls loadInto for the actual work but prepares it first using custom attributes on the link
 * If the target is an image, its parent DOM element is used instead
 * 
 * Custom attributes handled:
 * - 'method' = the HTTP method to be used for the call
 * - 'href' = the url to load
 * - 'into' = the target element to update
 * - 'from' = a JSON string stating what paremeters need to be fetched from the value of DOM elements
 * 		For example, a combo box can pass its value along with the call as follows:
 * 		{'option' : 'dom_element_id'}
 * 		where 'option' is the parameter to be appended
 * 		and 'dom_element_id' specifies the id of the combo box
 * - 'parameters' = a JSON string stating extra parameters to be passed in the URL
 * - 'evaluate' = a JavaScript string to be evaluated and the result added to the URL
 * - 'also' = a JSON string stating additional calls that need to be made
 * 		For example, if you need to hide comments from their holder when an article is reloaded:
 * 		{'dom_element_id' : ''}
 * 		Possible values to be passed inside the JSON hash are:
 * 		- '' = will clear the innerHTML of the element
 * 		- 'hide' = will hide the entire element from the page
 * 		- url = will load the url via ajax into the element
 * 
 * In case of using 'also' with a url, the same parameters passed to the original href url
 * will be passed to the other urls for convenience
 * If you need a parameter to be specific to one url only it has to be appended to that url 
 */
function ajaxClick(event) {  
	latestEvent = event;		
	var el = $(event.target);
	while (!el.is("a") && !el.is("button") && !el.is("select") && !el.is("input")) {
		el = el.parent();
		if (el.is('body')) return;
	};
	
	var into = $('#'+el.attr('into'));
	var method = el.attr('method') || 'get';
	if(el.attr('validate')){
		eval('var validation = (' + el.attr('validate') + ')');
		if(validation == false)
			return false;
	}
	var params = {};
	var parameters = el.attr('parameters');
	if(parameters)
		eval('params = (' + parameters + ')');
	
	if (el.attr('evaluate')) {
		eval('var evalhash = (' + el.attr('evaluate') + ')');
		jQuery.each(evalhash, function(param, value) {
			if(value != '')
				params[param] = value;
		});
	}

	if (el.attr('from')) {
		eval('var hash = (' + el.attr('from') + ')');
		jQuery.each(hash, function(param, dom) {
  			var from = $( "#"+dom );			
			if (from) {
				params[param] = from.val();
			}	
		});
	}
	if (el.is('select')) {
		params[el.attr('name')] = el.val();
	}
	
	if (el.is('input:button')) {
		params[el.attr('name')] = el.val();
	}
	
	if (el.is('input:checkbox')) {
		params[el.attr('name')] = el.is(':checked');
	}
	
	if (el.is('input:radio')) {
		params[el.attr('name')] = el.val();
	}
	
	if (el.is('input:text')) {
		params[el.attr('name')] = el.val();
	}
	var url = el.attr('href');
	jQuery.each(params, function(i, val) {
  			url = append2URL( url, i, val);
		});
	
	loadInto(el.attr('into'), url, method, el);

	if (el.attr('also')) {
		eval('var hash = (' + el.attr('also') + ')');
		jQuery.each(hash, function(i, val) {
  			into = $( "#"+i );
			
			if (val == '') {
				into.html( '' );
			} else if (val == 'hide') {
				into.hide(400);
			} else {
				jQuery.each(params, function(i, j) {
		  			val = append2URL( val, i, j);
				});
				loadInto(i, val, 'get',el);
			}
		});
	}
	if(el.is('input:checkbox') || el.is('input:radio'))
		return true;
	else
		return false;
}

/*
 * Test the target element for custom attribute 'insert'
 * 
 * Possible values:
 * No attribute = the default is 'into'
 * 'into' = replace the innerHTML with the ajax-loaded data
 * 'replace' = replace the outerHTML with the ajax-loaded data
 * 'before' = add the new data as new HTML just before the target in the DOM
 * 'after' = add the new data as new HTML just following the target in the DOM
 */
function ajaxPlace( element, data ){
	
	if ((element == 'script') || (element == 'javascript')){
		eval(data);
		return false;
	}
	
	var target = $('#'+element);
	target.show();
	
	var bind = target.attr('bind');
	$('span.ajaxError[bind="' + bind + '"]').remove();
	
	if (!target.attr('insert') || (target.attr('insert') == 'into')) {
		target.html(data);
	}			
	if (target.attr('insert') == 'replace') {
		target.replaceWith(data);
	}
	if (target.attr('insert') == 'before') {
		target.before(data);
	}
	if (target.attr('insert') == 'after') {
		target.after(data);
	}
	if (target.attr('insert') == 'prepend') {
		target.prepend(data);
	}
	if (target.attr('insert') == 'append') {
		target.append(data);
	}
}

function ajaxCleanUp(id, bind){
	$('span.ajaxError[errorSource="' + id + '"]').remove();
	$('span.ajaxLoader[bind="' + bind + '"]').remove();}

/*
 * Shows an ajax waiting graphic in a suitable place according to the custom attribute 'insert'
 * 
 * Possible values:
 * No attribute = the default is 'into'
 * 'into' = replace the innerHTML with the ajax-loaded data
 * 'replace' = replace the outerHTML with the ajax-loaded data
 * 'before' = does nothing
 * 'after' = does nothing
 * 
 * It first of all triggers the custom event "ajaxBefore"
 * 
 * The loaded image should have a custom attribute of 'tmp'
 * so it can later be removed/replaced when necessary
 * 
 * You can provide your own image here
 */
function ajaxWait( element ) {
	
	$(document).trigger('ajaxBefore');	
	var target = $('#'+element);
	var loading = target.attr('hourglass');
	if (!loading) loading = ajaxHourglass;
	if (loading == 'none') return;
	
	var bind = target.attr('bind');
	var data = '<span class="ajaxLoader" bind="' + bind + '">' + loading + '</span>'; 
	
	if (!target.attr('insert') || (target.attr('insert') == 'into')) {
		target.show();
		target.html(data);
	}			
	if (target.attr('insert') == 'replace') {
		target.show();
		target.html(data);
	}
	if (target.attr('insert') == 'before') {
		target.before(data);
	}
	if (target.attr('insert') == 'after') {
		target.after(data);
	}
	if (target.attr('insert') == 'prepend') {
		target.prepend(data);
	}
	if (target.attr('insert') == 'append') {
		target.append(data);
	}
}


function ajaxError( element ) {
	var target = $('#'+element);
	var bind = target.attr('bind');
	var data = target.attr('errorMessage') || ajaxErrorMessage;

	data = '<span class="ajaxError" bind="' + bind + '">' + data + '</span>';

	ajaxCleanUp( target.attr('id'), target.attr('bind'));

	if (!target.attr('insert') || (target.attr('insert') == 'into')) {
		target.show();
		target.html(data);
	}			
	if (target.attr('insert') == 'replace') {
		target.show();
		target.html(data);
	}
	if (target.attr('insert') == 'before') {
		target.before(data);
	}
	if (target.attr('insert') == 'after') {
		target.after(data);
	}
	if (target.attr('insert') == 'prepend') {
		target.prepend(data);
	}
	if (target.attr('insert') == 'append') {
		target.append(data);
	}
}

/*
 * This function handles newly loaded data according to custom attributes: 
 * - converts all links marked by 'into' to ajax links
 * - converts all inputs and combo boxes marked by 'into' to ajax callers by adding onChange handlers
 * - converts all forms marked by 'into' to be submitted via ajax
 * - removes all images marked by 'tmp'
 * 
 * It finally triggers the custom event "ajaxLoad"
 */	
function ajaxify() {
  $('a[into]').removeAttr('onclick');

  $('a[into]:not([bind])').each(function(){
	  var link = $(this);
	  setBinder(this);	
	  link.bind('click', ajaxClick); 
  }); 

  $('select[into]:not([bind])').each(function(){
	  var select = $(this);
	  setBinder(this);
	  select.bind('change', ajaxClick); 
  }); 

  $('button[into]:not([bind])').each(function(){
	  var button = $(this);
	  setBinder(this);
	  button.bind('click', ajaxClick); 
  });
  
  $('input:button[into]:not([bind])').each(function(){
	  var button = $(this);
	  setBinder(this);
	  button.bind('click', ajaxClick); 
  });
  
  $('input:checkbox[into]:not([bind])').each(function(){
	  var checkbox = $(this);
	  setBinder(this);
	  checkbox.bind('click', ajaxClick); 
  }); 
  $('input:radio[into]:not([bind])').each(function(){
	  var radio = $(this);
	  setBinder(this);
	  radio.bind('click', ajaxClick); 
  }); 
  $('input:text[into]:not([bind])').each(function(){
	  var text = $(this);
	  setBinder(this);
	  text.bind('keyup', ajaxClick); 
  }); 
    
  if (HistoryMap) {
  	$('a[history]').bind('click', hashHistory);
  	$('select[history]').bind('change', hashHistory);
  	$('button[history]').bind('click', hashHistory);
  } 

  $('form[into]:not([bind])').each(function(){ 
	var form = $(this);
	var hasFileInput = form.has("input[type='file']");
	var hasHandledFileInput = form.has("input[type='file'][action]");
	if (!hasFileInput || hasHandledFileInput) {
		setBinder( this );
		form.submit(function(){
		
			latestSubmit = this;
			var form = $(this);
			
			if (form.attr('validate')) {
				eval('var validation = (' + form.attr('validate') + ')');
				if (validation == false) 
					return false;
			}
			
			var target = form.attr('into');
			if (target == 'self') 
				target = form.attr('id');
			
			evalOnStart(form, form.attr('into') );
			
			if (form.attr('also')) {
				eval('var hash = (' + form.attr('also') + ')');
				jQuery.each(hash, function(i, val){
					into = $("#" + i);
					
					if (val == '') {
						into.html('');
					}
					else 
						if (val == 'hide') {
							into.hide(400);
						}
						else {
							loadInto(i, val, 'get', form);
						}
				});
			}
			var method = form.attr('method') || 'POST';
			var url = form.attr('action');
			
			if (form.attr('into') == 'self') {
				if (!form.attr('insert') || form.attr('insert') == '') 
					form.attr('insert', 'before');
				ajaxWait(form.attr('id'));
			}
			else {
				$('#' + form.attr('into')).attr('bind', form.attr('bind'));
				ajaxWait(form.attr('into'));
			}
			
			$.ajax({
				type: method,
				dataType: 'html',
				data: form.serialize(),
				url: url,
				beforeSend: ajaxHeaders,
				success: function(data){
				
					data = evalOnLoad(form, form.attr('into'), data);
					
					ajaxCleanUp( form.attr('id'), form.attr('bind'));
					
					if (form.attr('into') == 'self') {
						ajaxPlace(form.attr('id'), data);
					}
					else {
						ajaxPlace(form.attr('into'), data);
					}
					
					ajaxify();
					evalOnComplete( form, form.attr('into') );
					
					return false;
				},
				error: function(jqXHR, textStatus, errorThrown){
					if (!form.attr('insert') || form.attr('insert') == '') 
						form.attr('insert', 'prepend');
					if (!form.attr('id') || form.attr('id') == '') 
						form.attr('id', form.attr('bind'));

					ajaxError(form.attr('id'));
					evalOnError( form, form.attr('into'), jqXHR, textStatus, errorThrown );
					
					ajaxCleanUp(form.attr('id'), form.attr('bind'));
					
					return false;
				}
			});
			
			return false;
		})
	  }
	});

	$('input[type="file"][action!]:not([bind])').each(function(){
		var ctl = $(this);
		setBinder( this );
		
		if (ctl.attr('action')) 
			addHiddenForm(ctl);
		else 
			redirectForm(ctl);
	});

  $(document).trigger('ajaxLoad');	
}

function ajaxHeaders(xhr){
	xhr.setRequestHeader("Accept", "text/ajax"); 
} 	


/*
 * The simplest form of ajax call
 * 
 * You can call this directly from your javascript as a shorthand function
 * 
 * It will call the usual calls and trigger the usual events
 */
function loadInto(element, url, method, source_element) {
	
	if (method == 'delete') {
		if (!confirm('Are You Sure?')) 
			return false;
	}

	var target = $('#'+element);
	target.attr('bind', source_element.attr('bind')); 

	$('span[bind="' + target.attr('bind') + '"]').remove();

	evalOnStart( source_element, element );

	ajaxWait(element);
	
	$.ajax({
  		type: method,
		dataType: 'html',
		url: url,
  		beforeSend: ajaxHeaders,
		success: function(data){

			data = evalOnLoad(source_element, element, data);

			ajaxPlace( element, data );
			ajaxCleanUp( $('#'+element).attr('id'), $('#'+element).attr('bind'));
			
			ajaxify();
			evalOnComplete( source_element, element );

			return false;
  		},
		error: function(jqXHR, textStatus, errorThrown){
			ajaxError( element );
			evalOnError( source_element, element, jqXHR, textStatus, errorThrown );
			
			return false;
  		}
	});
	return false;	
}

		function bindSubmit(form, bind){
			form.unbind('submit');
			form.submit( function(){
				var target;
				if (form.attr('into') == 'self'){
					target = form.attr('id');
				} else {
					target = form.attr('into');
				}
				
				$("#"+target).attr('bind',bind);
				if (form.attr('into') == 'self'){
					if(!form.attr('insert') || form.attr('insert') == '') form.attr('insert', 'before');
					ajaxWait( form.attr('id') );
				} else {
					ajaxWait( form.attr('into') );
				}

				var fr = $('iframe[bind="' +bind+ '"]');
			
				var fl = $('input[type="file"][bind="' +bind+ '"]');

				evalOnStart( form, form.attr('into') );
					
				fr.unbind( 'load' );
				fr.load( function(){
					var frame = $('iframe[name="frame' +bind+ '"]');
					res = frame.contents().find('html body').html();
					if (res){
						if (form.attr('into')){

							res = evalOnLoad(form, form.attr('into'), res);

							ajaxPlace( target, res );
								
						} else {
							ajaxPlace( target, res );
							$('.upload_div[bind="' +bind+ '"]').html( res );
						}
						evalOnComplete( form, form.attr('into') );
						
						fl.css('visibility', 'visible');
						$('.upload_div[bind="' +bind+ '"]').after(fl);
						
						ajaxCleanUp( form.attr('id'), form.attr('bind'));
						
						ajaxify();
					}
					
					fl.css('display', 'inline');
				});
			});
		};

		function bindHiddenSubmit(form, bind){
			form.unbind('submit');
			form.submit( function(){
				var target = form.attr('into');
				
				$("#"+target).attr('bind',bind);
				if (form.attr('into') == 'self'){
					if(!form.attr('insert') || form.attr('insert') == '') form.attr('insert', 'before');
					ajaxWait( form.attr('id') );
				} else {
					ajaxWait( form.attr('into') );
				}

				var fr = $('iframe[bind="' +bind+ '"]');
				var resultId = undefined;
			
				var fl = $('input[type="file"][bind="' +bind+ '"]');
				if (fl){
					
					resultId = fl.attr('resultId');
				}	
				evalOnStart( form, form.attr('into') );
					
				fr.unbind( 'load' );
				fr.load( function(){
					var frame = $('iframe[name="frame' +bind+ '"]');
					res = frame.contents().find('html body').html();
					if (res){
						if (form.attr('into')){
							if (form.attr('onLoad')) 
								res = evalOnLoad(form, form.attr('into'), res );

							ajaxPlace( target, res );
								
						} else {
							ajaxPlace( target, res );
							$('.upload_div[bind="' +bind+ '"]').html( res );
						}
						evalOnComplete( form, form.attr('into') );
						
						fl.css('visibility', 'visible');
						$('.upload_div[bind="' +bind+ '"]').after(fl);
						ajaxCleanUp( form.attr('id'), form.attr('bind'));

						ajaxify();
					}
					if (resultId){
						res = frame.contents().find('#'+resultId).html();
						$('input[type="hidden"][bind="' +bind+ '"]').attr('value', res);
						
					} else $('input[type="hidden"][bind="' +bind+ '"]').attr('value', fl.attr('value'));
					
					fl.css('display', 'inline');
				});
			});
		};
	
		function addHiddenForm(ctl){
			var num = ctl.attr('bind');
			$('body').append('<iframe id="frame' +num+ '" name="frame' +num+ '" bind="' +num+ '" src="about:blank" style="display:none"></iframe>');

			ctl.before('<span id="upload_div'+num+'" class="upload_div" bind="' + num + '"></span>');				
			$('body').append('<form id="form' +num+ '" target="frame' +num+ '"></form>');
			
			var f = $('form[id="form' +num+ '"]');
			f.css('display','none');
			
			ctl.unbind('change');
			ctl.change(function(){
				ctl.css('visibility', 'hidden');
				f.append( ctl );
				f.submit();		
			});

			if (f){
				f.attr('action', ctl.attr('action'));
				f.attr('target', 'frame' + num);
				f.attr('method', 'POST');
				f.attr('enctype', 'multipart/form-data');
				f.attr('encoding', 'multipart/form-data');
				f.attr('into', ctl.attr('into') || "upload_div"+num);
				f.attr('bind', ctl.attr('bind'));
				bindHiddenSubmit(f,num);
			}
		};
		
		function redirectForm(ctl){
			var b = ctl.attr('bind');
			$('body').append('<iframe id="frame' +b+ '" name="frame' +b+ '" bind="' +b+ '" src="about:blank" style="display:none"></iframe>');
			
			var f = ctl.parents('form:first');
			f.attr('bind',b);
			ctl.unbind('change');
			ctl.change(function(){
			});
				
 			if (f){
				f.attr('target', 'frame' +b);
				f.attr('method', 'POST');
				f.attr('enctype', 'multipart/form-data');
				f.attr('encoding', 'multipart/form-data');
				bindSubmit(f,b);
			}
		}




function HistoryMap()
{
	this.length = 0;
	this.items = new Array();
	for (var i = 0; i < arguments.length; i += 2) {
		if (typeof(arguments[i + 1]) != 'undefined') {
			this.items[arguments[i]] = arguments[i + 1];
			this.length++;
		}
	}
   
	this.removeItem = function(in_key)
	{
		var tmp_previous = undefined;
		if (typeof(this.items[in_key]) != 'undefined') {
			this.length--;
			tmp_previous = this.items[in_key];
			delete this.items[in_key];
		}
	   
		return tmp_previous;
	};

	this.getItem = function(in_key) {
		return this.items[in_key];
	};

	this.setItem = function(in_key, in_value)
	{
		var tmp_previous = undefined;
		if (typeof(in_value) != 'undefined') {
			if (typeof(this.items[in_key]) == 'undefined') {
				this.length++;
			}
			else {
				tmp_previous = this.items[in_key];
			}

			this.items[in_key] = in_value;
		}
	   
		return tmp_previous;
	};

	this.hasItem = function(in_key)
	{
		return typeof(this.items[in_key]) != 'undefined';
	};

	this.clear = function()
	{
		for (var i in this.items) {
			delete this.items[i];
		}

		this.length = 0;
	};
};

/*
 * This variable hold a hash map (associative array) of values and objects
 * We use it to store user events so we can undo/redo them as the browser moves through
 * its history
 * 
 * HistoryMap is declared by accorpistory.js
 */
var historyMap = new HistoryMap()
var latestHash
var latestEvent
var latestSubmit

function repeatLatest(){
	if (latestEvent){
		ajaxClick( latestEvent );		
	}
}

function repeatSubmit(){
	if (latestSubmit){
		ajaxSubmit( latestSubmit );		
	}
}

function repeatCall(hash){
	
	if (historyMap.hasItem(hash)) try {
		ajaxClick( historyMap.getItem(hash) );
	} catch(e){		
	}
}

/*
 * This function saves an event in a hash map referenced by the 'history' attribute
 * These events can later be run when the hash in the 'window.location' changes
 * (when the user presses the back button for instance)
 *
 * You will not need to call this yourself.
 */
function hashHistory(event){
	var el = $(event.target)
	var hh = el.attr('history')
	
	historyMap.setItem( hh, event );
	
	// this is set to prevent double-calling.
	// when hashchange is triggered outside here, a call is fired. 
	latestHash = hh;
	window.location.hash = hh;
				
//	if ((el.attr('history') == 'id') || (el.attr('history') == '')) {
//		window.location.hash = el.id;
//	} else {
//		window.location.hash = el.attr('history');
//	}
//	historyMap.setItem( el.attr('history'), el );		// or event?
}


/*
 * This function prepares the document initially (calls ajaxify)
 * and sets up the necessary handler for the jQuery event 'beforeSend' to handle Rails
 * in the manner described by Accorpa.
 * 
 * For Rails, we need a custom MIME type 'text/ajax'
 * You may change or remove this line if you need another way of using Rails
 * 
 * You may add handlers for the custom events 'ajaxBefore' and 'ajaxLoad'
 * to handle special javaScript functions you need to apply
 * such as CKEditor, jQuery UI controls, table sorting scripts, etc.   
 */
$(document).ready(function() {
    
	ajaxify();
	
	$(window).hashchange( function(){
		var hash = location.hash.replace( /^#/, '' );		
		var el;
		
		if (hash == latestHash) return;
		latestHash = hash;
 				
		if (historyMap.hasItem(hash)) {
 			ajaxClick( historyMap.getItem(hash) );
			
		} else {
			el = $('[history='+hash+']');
			if (el){
				el.click();
			}
		}
	})
// This code is for effective bookmarking.
// It interferes with the bookmarking of LightBox.

//	if (window.location.hash == '') {
//		window.location.hash = 'home';
//	} else {
//		$(window).hashchange();
//	}
	if (window.location.hash != '') {
		$(window).hashchange();
	}
})