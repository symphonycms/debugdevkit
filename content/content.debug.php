<?php

	require_once(TOOLKIT . '/class.devkit.php');
	require_once(EXTENSIONS . '/debugdevkit/lib/lib.bitterhtml.php');
	
	class Content_DebugDevKit_Debug extends DevKit {
		protected $_view = '';
		protected $_xsl = '';
		protected $_full_utility_list = '';
		
		public function __construct(){
			parent::__construct();
			
			$this->_title = __('Debug');
			$this->_query_string = parent::__buildQueryString(array('debug'));
			
			if (!empty($this->_query_string)) {
				$this->_query_string = '&amp;' . General::sanitize($this->_query_string);
			}
		}
		
		protected function appendJump() {
			$list = new XMLElement('ul');
			$list->setAttribute('id', 'jump');
			
			$list->appendChild($this->buildJumpItem(
				__('Params'),
				'?debug=params' . $this->_query_string,
				($this->_view == 'params')
			));
			
			$list->appendChild($this->buildJumpItem(
				__('XML'),
				'?debug=xml' . $this->_query_string,
				($this->_view == 'xml')
			));
			
			$filename = basename($this->_pagedata['filelocation']);
			
			$item = $this->buildJumpItem(
				$filename,
				"?debug={$filename}" . $this->_query_string,
				($this->_view == $filename),
				"?debug-edit=" . $this->_pagedata['filelocation'] . $this->_query_string
			);
			
			$utilities = $this->__buildUtilityList($this->__findUtilitiesInXSL($this->_xsl), 1, $this->_view);
			
			if (is_object($utilities)) {
				$item->appendChild($utilities);
			}
			
			$list->appendChild($item);
			
			$list->appendChild($this->buildJumpItem(
				__('Result'),
				'?debug=result' . $this->_query_string,
				($this->_view == 'result')
			));
			
			$this->Body->appendChild($list);
		}
		
		protected function buildJumpItem($name, $link, $active = false, $link_edit = null) {
			$item = new XMLElement('li');
			$anchor = Widget::Anchor($name,  $link);
			$anchor->setAttribute('class', 'inactive');
			
			if ($active == true) {
				$anchor->setAttribute('class', 'active');
			}
			
			// Edit link:
			if ($link_edit) {
				$edit = Widget::Anchor(__('Edit'), $link_edit);
				$edit->setAttribute('class', 'edit');
				$item->appendChild($edit);
			}
			
			$item->appendChild($anchor);
			
			return $item;
		}
		
		public function appendContent() {
			$this->_view = (strlen(trim($_GET['debug'])) == 0 ? 'xml' : $_GET['debug']);
			$this->_xsl = @file_get_contents($this->_pagedata['filelocation']);
			
			$this->appendHeader();
			$this->appendNavigation();
			$this->appendJump();
			
			if ($this->_view == 'params') {
				$this->Body->appendChild($this->__buildParams($this->_param));
				
			} else if ($this->_view == 'xml') {
				$this->Body->appendChildArray($this->__buildCodeBlock($this->_xml, 'xml'));
				
			} else if ($this->_view == 'result') {
				$this->Body->appendChildArray($this->__buildCodeBlock($this->_output, 'result'));
				
			} else {
				if ($_GET['debug'] == basename($this->_pagedata['filelocation'])) {
					$this->Body->appendChildArray($this->__buildCodeBlock($this->_xsl, basename($page['filelocation'])));
					
				} else if ($_GET['debug']{0} == 'u') {
					if (is_array($this->_full_utility_list) && !empty($this->_full_utility_list)) {
						foreach ($this->_full_utility_list as $u) {
							if ($_GET['debug'] != 'u-'.basename($u)) continue;
							
							$this->Body->appendChildArray($this->__buildCodeBlock(@file_get_contents(UTILITIES . '/' . basename($u)), 'u-'.basename($u)));
							
							break;
						}
					}
				}
			}
		}
		
		protected function __buildParams($params){
			
			if(!is_array($params) || empty($params)) return;
			
			$dl = new XMLElement('dl', NULL, array('id' => 'params'));
			
			foreach($params as $key => $value){				
				$dl->appendChild(new XMLElement('dt', "\${$key}"));
				$dl->appendChild(new XMLElement('dd', "'{$value}'"));
			}
			
			return $dl;
			
		}
		
		protected function __buildUtilityList($utilities, $level=1, $view = null) {
			if (!is_array($utilities) || empty($utilities)) return;
			
			$list = new XMLElement('ul');
			
			foreach ($utilities as $u) {
				$filename = basename($u);
				$item = $this->buildJumpItem(
					$filename,
					"?debug=u-{$filename}" . $this->_query_string,
					($view == "u-{$filename}"),
					"?debug-edit={$u}" . $this->_query_string
				);
				
				$child_utilities = $this->__findUtilitiesInXSL(
					@file_get_contents(UTILITIES . '/' . $filename)
				);
				
				if (is_array($child_utilities) && !empty($child_utilities)) {
					$item->appendChild($this->__buildUtilityList($child_utilities, $level + 1, $view));
				}
				
				$list->appendChild($item);
			}
			
			return $list;
		}
		
		protected function __findUtilitiesInXSL($xsl) {
			if ($xsl == '') return;
			
			$utilities = null;
			
			if (preg_match_all('/<xsl:(import|include)\s*href="([^"]*)/i', $xsl, $matches)) {
				$utilities = $matches[2];
			}
			
			if (!is_array($this->_full_utility_list)) {
				$this->_full_utility_list = array();
			}
			
			if (is_array($utilities) && !empty($utilities)) {
				$this->_full_utility_list = array_merge($utilities, $this->_full_utility_list);
			}
			
			return $utilities;
		}
		
		protected function __buildCodeBlock($code, $id) {
			$line_numbering = new XMLElement('ol');

			$lang = new BitterLangHTML;

			$code = $lang->process(
				stripslashes($code), 4
			);
	
			$code = preg_replace(array('/^<span class="markup">/i', '/<\/span>$/i'), NULL, trim($code));
			
			$lines = preg_split('/(\r\n|\r|\n)/i', $code);
			
			$value = NULL;
			
			foreach($lines as $n => $l){
				$value .= sprintf('<span id="line-%d"></span>%s', ($n + 1), $l) . General::CRLF;
				$line_numbering->appendChild(new XMLElement('li', sprintf('<a href="#line-%d">%1$d</a>', ($n + 1))));
			}
			
			$pre = new XMLElement('pre', sprintf('<code><span class="markup">%s </span></code>', trim($value)));
			
			return array($line_numbering, $pre);
			
		}
	}
	
?>