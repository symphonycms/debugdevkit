<?php
	
	require_once(TOOLKIT . '/class.devkit.php');
	
	class Content_DebugDevKit_Edit extends Content_DebugDevKit_Debug {
		protected $_file = '';
		
		public function __construct(){
			parent::__construct();
			
			$this->_title = __('Debug');
			$this->_query_string = parent::__buildQueryString(array('debug-edit'));
			
			if (!empty($this->_query_string)) {
				$this->_query_string = '&amp;' . General::sanitize($this->_query_string);
			}
		}
		
		public function appendContent() {
			$this->addStylesheetToHead(URL . '/extensions/debugutility/assets/edit.css', 'screen', 1000);
			
			$this->_file = @(strlen(trim($_GET['debug-edit'])) == 0 ? null : $_GET['debug-edit']);
			$this->_xsl = @file_get_contents($this->_pagedata['filelocation']);
			
			$this->appendHeader();
			$this->appendNavigation();
			
			$input = Widget::Textarea('fields[content]', 20, 50);
			$input->setValue(
				htmlentities(file_get_contents($this->_file))
			);
			
			$this->Body->appendChild($input);
		}
	}
	
?>