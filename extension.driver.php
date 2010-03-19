<?php
	
	class Extension_DebugDevKit extends Extension {
	/*-------------------------------------------------------------------------
		Definition:
	-------------------------------------------------------------------------*/
		
		public static $active = false;
		
		public function about() {
			return array(
				'name'			=> 'Debug Devkit',
				'version'		=> '1.0.9',
				'release-date'	=> '2010-03-19',
				'author'		=> array(
					'name'			=> 'Rowan Lewis',
					'website'		=> 'http://rowanlewis.com/',
					'email'			=> 'me@rowanlewis.com'
				)
			);
		}
		
		public function getSubscribedDelegates() {
			return array(
				array(
					'page'		=> '/frontend/',
					'delegate'	=> 'FrontendDevKitResolve',
					'callback'	=> 'frontendDevKitResolve'
				),
				array(
					'page'		=> '/frontend/',
					'delegate'	=> 'ManipulateDevKitNavigation',
					'callback'	=> 'manipulateDevKitNavigation'
				)
			);
		}
		
		public function frontendDevKitResolve($context) {
			if (false or isset($_GET['debug'])) {
				require_once(EXTENSIONS . '/debugdevkit/content/content.debug.php');
				
				$context['devkit'] = new Content_DebugDevkit_Debug();
				self::$active = true;
			}
			
			// Capture debug information:
			else if (isset($_GET['debug-capture'])) {
				require_once(EXTENSIONS . '/debugdevkit/content/content.capture.php');
				
				$context['devkit'] = new Content_DebugDevkit_Capture();
			}
		}
		
		public function manipulateDevKitNavigation($context) {
			$xml = $context['xml'];
			$item = $xml->createElement('item');
			$item->setAttribute('name', __('Debug'));
			$item->setAttribute('handle', 'debug');
			$item->setAttribute('active', (self::$active ? 'yes' : 'no'));
			
			$parent = $xml->documentElement;
			
			if ($parent->hasChildNodes()) {
				$parent->insertBefore($item, $parent->firstChild);
			}
			
			else {
				$xml->documentElement->appendChild($item);
			}
		}
	}
	
?>