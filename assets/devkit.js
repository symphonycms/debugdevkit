jQuery(document).ready(function() {
	var $ = jQuery;
	var table = $('#source > table');
	var depth = 0; var opened = [];
	
	// Create tag mapping attributes:
	table.find('.tag').each(function(position) {
		var tag = $(this);
		
		// Self closing:
		if (tag.text().match(/\/>$/)) return;
		
		// Tag content:
		else if (tag.text().match(/[^>]$/)) return;
		
		// Closing:
		else if (tag.hasClass('.close')) {
			tag.attr('handle', opened.pop());
			depth = depth - 1;
		}
		
		// Opening:
		else {
			depth = depth + 1;
			tag.attr('handle', depth + '-' + position);
			opened.push(tag.attr('handle'));
		}
	});
	
	table.find('.tag[handle]').hover(
		function() {
			var handle = $(this).attr('handle');
			
			table.find('.tag[handle = "' + handle + '"]')
				.addClass('tag-match');
		},
		function() {
			var handle = $(this).attr('handle');
			
			table.find('.tag[handle = "' + handle + '"]')
				.removeClass('tag-match');
		}
	);
	
/*-----------------------------------------------------------------------------
	Target
-----------------------------------------------------------------------------*/
	
	var target = {
		hash:		'',
		jump:		true,
		
		monitor:	function() {
			if (target.hash != location.hash) {
				target.hash = location.hash;
				
				// Change highlight:
				if (target.hash.match(/^#line-(,?[0-9]+(-[0-9]+)?)+$/)) {
					highlight.refresh(target.hash);
				}
				
				else if (!target.jump) {
					highlight.clear();
				}
				
				// Scroll to it:
				if (target.jump) {
					$('#content').scrollTo(
						table.find('tr.target'),
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
	
/*-----------------------------------------------------------------------------
	Highlight
-----------------------------------------------------------------------------*/
	
	var highlight = {
		targets:	[],
		negated:	false,
		running:	false,
		
		refresh:	function(hash) {
			var values = hash.replace(/^#line-,?/, '').split(',');
			
			highlight.targets = [];
			
			table.addClass('highlight');
			table.find('tr.target').removeClass('target');
			
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
				
				var count = from;;
				
				while (count <= to) {
					highlight.targets.push(count);
					table
						.find('#' + count)
						.addClass('target');
					
					count = count + 1;
				}
			}
		},
		
		rewrite:	function() {
			var last = null;
			var hash = '';
			
			highlight.targets.sort(function(a, b) {
				return (a < b ? -1 : 1);
			});
			
			$.each(highlight.targets, function(index, value) {
				if (last != value - 1) {
					if (last != null) hash = hash + ',';
					
					hash = hash + value;
				}
				
				else if (highlight.targets[index + 1] != value + 1) {
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
		
		clear:		function() {
			highlight.targets = [];
			table.removeClass('highlight');
			table.find('tr.target').removeClass('target');
		},
		
		add:		function(line) {
			if (highlight.targets.indexOf(line) != -1) return true;
			
			highlight.targets.push(line);
			highlight.rewrite();
		},
		
		remove:		function(line) {
			if (highlight.targets.indexOf(line) == -1) return true;
			
			var before = highlight.targets;
			
			after = before.splice(before.indexOf(line));
			after.shift();
			
			highlight.targets = before.concat(after);
			highlight.rewrite();
		},
		
		events:		{
			ignore:		function() {
				return false;
			},
			
			start:		function() {
				var row = $(this).parent();
				
				table.find('tr')
					.bind('mouseenter', highlight.events.toggle)
					.bind('mouseup', highlight.events.stop);
				
				if (row.hasClass('target')) {
					highlight.negated = true;
					highlight.remove(parseInt(row.attr('id')));
				}
				
				else {
					highlight.add(parseInt(row.attr('id')));
				}
				
				return false;
			},
			
			toggle:		function() {
				var row = $(this);
				
				if (row.parents('tr').length) {
					row = row.parents('tr');
				}
				
				if (highlight.negated) {
					highlight.remove(parseInt(row.attr('id')));
				}
				
				else {
					highlight.add(parseInt(row.attr('id')));
				}
				
				return false;
			},
			
			stop:		function() {
				table.find('tr')
					.unbind('mouseenter', highlight.events.toggle)
					.unbind('mouseup', highlight.events.stop);
				
				highlight.negated = false;
				
				return false;
			}
		}
	};
	
	// Enable line highlighting:
	table.find('tr th a')
		.bind('click', highlight.events.ignore);
	table.find('tr th')
		.bind('mousedown', highlight.events.start);
});