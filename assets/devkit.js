jQuery(document).ready(function() {
	var $ = jQuery;
	var source = $('#source pre');
	
/*-----------------------------------------------------------------------------
	Target overloading:
-----------------------------------------------------------------------------*/
	
	var target = {
		hash:		'',
		jump:		true,
		
		monitor:	function() {
			if (target.hash != location.hash) {
				target.hash = location.hash;
				
				// Change highlight:
				if (target.hash.match(/^#line-(,?[0-9]+(-[0-9]+)?)+$/)) {
					highlight.read_hash(target.hash);
				}
				
				else if (!target.jump) {
					highlight.clear_all();
				}
				
				// Scroll to it:
				if (target.jump) {
					$('#content').scrollTo(
						source.find('line.selected'),
						{
							offset: 0 - ($(window).height() / 4)
						}
					);
				}
			}
			
			target.jump = false;
		}
	};
	
	// Track target changes:
	setInterval(target.monitor, 10);
	
	$('source *').bind('onbeforecopy', function() {
		console.log('wtf');
	});
	
/*-----------------------------------------------------------------------------
	Tag matching:
-----------------------------------------------------------------------------*/
	
	var depth = 0; var opened = [];
	
	// Create tag mapping attributes:
	source.find('.tag').each(function(position) {
		var tag = $(this);
		
		// Self closing:
		if (tag.text().match(/\/>$/)) return;
		
		// Tag content:
		else if (tag.text().match(/[^>]$/)) return;
		
		// Closing:
		else if (tag.hasClass('.close')) {
			tag.attr('handle', opened.pop());
			tag.attr('id', 'close-' + tag.attr('handle'));
			depth = depth - 1;
		}
		
		// Opening:
		else {
			depth = depth + 1;
			tag.attr('handle', depth + '-' + position);
			tag.attr('id', 'open-' + tag.attr('handle'));
			opened.push(tag.attr('handle'));
		}
	});
	
	source.find('.tag[handle]').bind('click', function() {
		var current = $(this), handle = current.attr('handle');
		var opposite = source.find('.tag[handle = "' + handle + '"]').not(current);
		
		source.find('.tag-match').removeClass('tag-match');
		
		current.addClass('tag-match');
		opposite.addClass('tag-match');
		
		// Jump to opposite:
		current.bind('mousedown', function() {
			$('#content').scrollTo(opposite, {
				offset: 0 - current.position().top
			});
			
			return false;
		});
		
		opposite.bind('mousedown', function() {
			$('#content').scrollTo(current, {
				offset: 0 - opposite.position().top
			});
			
			return false;
		});
		
		// Clear:
		source.bind('mousedown', function() {
			source.unbind('mousedown');
			current.removeClass('tag-match').unbind('mousedown');
			opposite.removeClass('tag-match').unbind('mousedown');
		});
		
		return false;
	});
	
/*-----------------------------------------------------------------------------
	Line highlighting:
-----------------------------------------------------------------------------*/
	
	var highlight = {
		action:		null,
		from:		null,
		to:			null,
		
		read_hash:	function(hash) {
			var values = hash.replace(/^#line-,?/, '').split(',');
			
			highlight.action = 'selected';
			highlight.clear_all();
			
			while (values.length) {
				var value = values.shift();
				var bits = /([0-9]+)(-([0-9]+))?/.exec(value);
				
				if (bits[3] == undefined) {
					from = parseInt(bits[1]);
					to = parseInt(bits[1]);
				}
				
				else {
					from = parseInt(bits[1]);
					to = parseInt(bits[3]);
				}
				
				highlight.draw_range(from, to);
			}
		},
		
		write_hash:	function() {
			var last = null, hash = '';
			var selection = []
			
			source.find('line.selected').each(function() {
				var id = parseInt($(this).attr('id'));
				
				if (selection.indexOf(id) == -1) {
					selection.push(id);
				}
			});
			
			selection.sort(function(a, b) {
				return (a < b ? -1 : 1);
			});
			
			$.each(selection, function(index, value) {
				if (last != value - 1) {
					if (last != null) hash = hash + ',';
					
					hash = hash + value;
				}
				
				else if (selection[index + 1] != value + 1) {
					hash = hash + '-' + value;
				}
				
				last = value;
			});
			
			if (hash == '') {
				location.replace('#');
			}
			
			else {
				location.replace('#line-' + hash);
			}
		},
		
		clear_all:	function() {
			source.find('line')
				.removeClass('selected selecting deselecting');
		},
		
		draw_range:	function(from, to) {
			var count = from;
			
			while (count <= to) {
				source.find('#' + count)
					.addClass(highlight.action);
				
				count = count + 1;
			}
		},
		
		event_ignore:		function() {
			return false;
		},
			
		event_start:	function() {
			var line = $(this).parent();
			
			source
				.bind('mousedown', highlight.event_ignore);
			source.find('line')
				.bind('mouseenter', highlight.event_toggle)
				.bind('mouseup', highlight.event_stop);
			
			highlight.from = parseInt(line.attr('id'));
			highlight.to = highlight.from;
			highlight.action = 'selecting';
			
			if (line.hasClass('selected')) {
				highlight.action = 'deselecting';
			}
			
			highlight.draw_range(
				highlight.from, highlight.to
			);
			
			return false;
		},
		
		event_toggle:	function() {
			var line = $(this);
			
			source.find('.selecting, .deselecting')
				.removeClass('selecting deselecting');
			
			highlight.to = parseInt(line.attr('id'));
			highlight.draw_range(
				Math.min(highlight.from, highlight.to),
				Math.max(highlight.from, highlight.to)
			);
			
			return false;
		},
		
		event_stop:		function() {
			source.find('.selecting')
				.removeClass('selecting')
				.addClass('selected');
			
			source.find('.deselecting')
				.removeClass('deselecting selected active');
			
			source
				.unbind('mousedown', highlight.event_ignore);
			source.find('line')
				.unbind('mouseenter', highlight.event_toggle)
				.unbind('mouseup', highlight.event_stop);
			
			highlight.write_hash();
			
			return false;
		}
	};
	
	source.find('line marker')
		.bind('mousedown', highlight.event_start);
});