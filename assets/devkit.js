/*-----------------------------------------------------------------------------
	Session handler:
-----------------------------------------------------------------------------*/
	
	function Session(parent) {
		var self = this;
		var current = '';
		var params = {};
		
		self.refresh = function() {
			if (current == location.hash) return true;
			
			current = location.hash;
			params = {};
			
			jQuery.each(current.slice(1).split('&'), function(index, param) {
				param = decodeURIComponent(param);
				
				if (!/^([a-z]+)\-(.+)$/.test(param)) return true;
				
				var bits = /^([a-z]+)\-(.+)$/.exec(param);
				var value = bits.pop(), name = bits.pop();
				
				params[name] = value;
			});
			
			jQuery(parent).trigger('sessionupdate');
		};
		
		self.get = function(name) {
			return params[name];
		};
		
		self.set = function(name, value) {
			var bits = [];
			
			if (value != null) {
				params[name] = value;
			}
			
			else {
				delete params[name];
			}
			
			jQuery.each(params, function(name, value) {
				bits.push(encodeURIComponent(name + '-' + value));
			});
			
			location.hash = bits.join('&');
			self.refresh();
		};
		
		setInterval(self.refresh, 10);
		
		return self;
	};
	
/*-----------------------------------------------------------------------------
	Line highlighting:
-----------------------------------------------------------------------------*/
	
	function LineHighlighter(source, session) {
		var self = this;
		
		self.action = null;
		self.jumped = false;
		self.from = null;
		self.to = null;
		
		self.refresh = function() {
			var value = session.get('line');
			
			if (value) {
				var values = value.split(',');
				
				self.action = 'selected';
				self.clear();
				
				while (values.length) {
					var value = values.shift();
					var bits = /([0-9]+)(-([0-9]+))?/.exec(value);
					
					if (bits[3] == undefined) {
						self.from = parseInt(bits[1]);
						self.to = parseInt(bits[1]);
					}
					
					else {
						self.from = parseInt(bits[1]);
						self.to = parseInt(bits[3]);
					}
					
					self.draw(self.from, self.to);
					source.addClass('selected');
				}
			}
			
			else {
				self.clear();
			}
			
			self.jumped = false;
		};
		
		self.clear = function() {
			source.removeClass('selected');
			source.find('line')
				.removeClass('selected selecting deselecting');
		};
		
		self.draw = function() {
			var from = Math.min(self.from, self.to);
			var to = Math.max(self.from, self.to);
			var selector = 'line';
			var index_from = from - 2;
			var index_to = (to - from) + 1;
			
			if (index_from >= 0) {
				selector = selector + ':gt(' + index_from + ')';
			}
			
			selector = selector + ':lt(' + index_to + ')';
			
			source.find(selector).addClass(self.action);
		};
		
	/*-------------------------------------------------------------------------
		Drag handlers:
	-------------------------------------------------------------------------*/
		
		self.drag_ignore = function() {
			return false;
		};
		
		self.drag_start = function() {
			var line = jQuery(this).parent();
			
			source
				.bind('mousedown', self.drag_ignore);
			source.find('line')
				.bind('mouseover', self.drag_select)
				.bind('mouseup', self.drag_stop);
			
			self.action = 'selecting';
			self.to = self.from = parseInt(line.attr('id'));
			
			if (line.hasClass('selected')) {
				self.action = 'deselecting';
			}
			
			self.draw();
			
			return false;
		};
		
		self.drag_select = function() {
			var line = jQuery(this);
			
			source.find('.selecting, .deselecting')
				.removeClass('selecting deselecting');
			
			self.to = parseInt(line.attr('id'));
			self.draw();
			
			return false;
		};
		
		self.drag_stop = function() {
			var last = null, hash = '';
			var selection = []
			
			source.addClass('selected');
			source.find('.selecting')
				.removeClass('selecting')
				.addClass('selected');
			
			source.find('.deselecting')
				.removeClass('deselecting selected');
			
			source
				.unbind('mousedown', self.drag_ignore);
			source.find('line')
				.unbind('mouseover', self.drag_select)
				.unbind('mouseup', self.drag_stop);
			
			source.find('line.selected').each(function() {
				var id = parseInt(jQuery(this).attr('id'));
				
				if (selection.indexOf(id) == -1) {
					selection.push(id);
				}
			});
			
			selection.sort(function(a, b) {
				return (a < b ? -1 : 1);
			});
			
			jQuery.each(selection, function(index, value) {
				if (last != value - 1) {
					if (last != null) hash = hash + ',';
					
					hash = hash + value;
				}
				
				else if (selection[index + 1] != value + 1) {
					hash = hash + '-' + value;
				}
				
				last = value;
			});
			
			if (hash == '') session.set('line', null);
			else session.set('line', hash);
			
			return false;
		};
		
		source.bind('sessionupdate', self.refresh);
		source.find('line marker')
			.bind('mousedown', self.drag_start);
		
		return this;
	};
	
/*-----------------------------------------------------------------------------
	Tag matching:
-----------------------------------------------------------------------------*/
	
	function TagMatcher(source, session) {
		var self = this;
		
		self.depth = 0;
		self.stack = [];
		
		self.refresh = function() {
			var handle = session.get('tag');
			
			if (handle) {
				source.find('.tag[handle = "' + handle + '"]:first').click();
			}
		};
		
		// Create tag mapping attributes:
		source.find('.tag').each(function(position) {
			var tag = jQuery(this);
			
			// Self closing:
			if (tag.text().match(/\/>$/)) return;
			
			// Tag content:
			else if (tag.text().match(/[^>]$/)) return;
			
			// Closing:
			else if (tag.hasClass('.close')) {
				tag.attr('handle', self.stack.pop());
				tag.attr('id', 'close-' + tag.attr('handle'));
				self.depth = self.depth - 1;
			}
			
			// Opening:
			else {
				self.depth = self.depth + 1;
				tag.attr('handle', self.depth + '-' + position);
				tag.attr('id', 'open-' + tag.attr('handle'));
				self.stack.push(tag.attr('handle'));
			}
		});
		
		source.find('.tag[handle]').bind('click', function() {
			if (event.button != 0) return true;
			
			var current = jQuery(this), handle = current.attr('handle');
			var opposite = source.find('.tag[handle = "' + handle + '"]').not(current);
			
			if (current.is('.tag-match')) return false;
			
			session.set('tag', handle);
			
			source.find('.tag-match')
				.removeClass('tag-match');
			current.addClass('tag-match');
			opposite.addClass('tag-match');
			
			// self.jumped to opposite:
			current.bind('mousedown', function(event) {
				jQuery('#content').scrollTo(opposite, {
					offset: (0 - event.clientY) + (opposite.height() / 2) + 40
				});
				
				return false;
			});
			
			opposite.bind('mousedown', function(event) {
				jQuery('#content').scrollTo(current, {
					offset: (0 - event.clientY) + (current.height() / 2) + 40
				});
				
				return false;
			});
			
			// Clear:
			source.bind('mousedown', function() {
				session.set('tag', null);
				source.unbind('mousedown');
				current.removeClass('tag-match').unbind('mousedown');
				opposite.removeClass('tag-match').unbind('mousedown');
			});
			
			return false;
		});
		
		source.bind('sessionupdate', self.refresh);
		
		return self;
	};
	
/*-----------------------------------------------------------------------------
	XPath highlighting:
-----------------------------------------------------------------------------*/
	
	function XPathMatcher(source, session) {
		var self = this;
		var index = -1, last_tag_index = -1;
		var in_text = false, in_document = false;
		var source_document  = new DOMParser()
			.parseFromString(source.text(), 'text/xml');
		var container = jQuery('<div />')
			.attr('id', 'input')
			.insertBefore('#content');
		var input = jQuery('<input />')
			.attr('autocomplete', 'off')
			.val('//*')
			.appendTo(container);
		var output = jQuery('<div />')
			.attr('id', 'output')
			.insertBefore('#content')
			.hide();
		var nodes = {};
		var elements = [];
		var attributes = [];
		var texts = [];
		
		self.refresh = function() {
			var value = session.get('xpath');
			
			//console.log(encodeURIComponent('//*[contains(., "foo&bar")]'));
			
			if (value) {
				input.val(value);
				self.execute();
			}
		};
		
		self.execute = function() {
			source.find('.xpath-match').removeClass('xpath-match');
			
			var parent = source_document.documentElement;
			var resolver = source_document.createNSResolver(parent);
			var matches = source_document.evaluate(
				input.val(), parent, resolver, 0, null
			);
			
			if (matches.resultType < 4) {
				var value = null, type = null;
				
				switch (matches.resultType) {
					case 1: value = matches.numberValue; break;
					case 2: value = matches.stringValue; break;
					case 3: value = matches.booleanValue; break;
				}
				
				if (value == null) return true;
				
				output.text(value).fadeIn(150);
				
				setTimeout(function() {
					output.fadeOut(250);
				}, 3000);
				
				return true;
			}
			
			while (match = matches.iterateNext()) {
				var index = source_document.evaluate(
					'count((ancestor::* | preceding::* | ancestor::* /@* | preceding::* /@* | preceding::text())[not(comment())])',
					match, resolver, 1, null
				).numberValue;
	 			
				// Attributes are offset:
				if (match.nodeType === 2) {
					index += Array.prototype.indexOf.call(match.ownerElement.attributes, match);
					index -= match.ownerElement.attributes.length;
				}
				
				jQuery.each(nodes[index], function() {
					jQuery(this).not(':empty').addClass('xpath-match');
				});
			}
			
			return true;
		};
		
		source.find('.tag, .attribute, .text, .cdata').each(function() {
			var node = jQuery(this);
			
			if (node.is('.tag.open')) {
				if (node.text().match(/^[^<]/)) {
					nodes[last_tag_index].push(node);
					in_text = false;
					in_document = true;
					return true;
				}
				
				index += 1;
				last_tag_index = index;
				in_text = false;
				in_document = true;
			}
			
			else if (node.is('.tag.close')) {
				in_text = false;
				return true;
			}
			
			else if (in_document && node.is('.text, .cdata')) {
				if (!in_text) index += 1;
				
				in_text = true;
			}
			
			else if (in_document && node.is('.attribute')) {
				if (/^xmlns:?/i.test(node.text())) {
					in_text = false;
					return true;
				}
				
				index += 1;
				in_text = false;
			}
			
			else return true;
			
			if (index >= 0) {
				if (nodes[index]) {
					nodes[index].push(node);
				}
				
				else {
					nodes[index] = [node];
				}
				
				// End tag:
				if (node.is('.tag.open[handle]')) {
					nodes[index].push(source.find(
						'.tag.close[handle = "'
						+ node.attr('handle')
						+ '"]'
					));
				}
			}
		});
		
		input.bind('keyup', function(event) {
			if ((event || window.event).keyCode !== 13) {
				input.change(); return true;
			}
			
			if (session.get('xpath') != input.val()) {
				session.set('xpath', input.val());
			}
			
			else self.execute();
			
			return false;
		});
		
		input.bind('change', function() {
			if (input.val() != '') return true;
			
			source.find('.xpath-match').removeClass('xpath-match');
		});
		
		source.bind('sessionupdate', self.refresh);
	};
	
/*---------------------------------------------------------------------------*/
	
	jQuery(document).ready(function() {
		var source = jQuery('#source pre');
		
		if (source.length) {
			var session = new Session(source);
			
			TagMatcher(source, session);
			XPathMatcher(source, session);
			LineHighlighter(source, session);
			
			session.refresh();
		}
	});
	
/*---------------------------------------------------------------------------*/