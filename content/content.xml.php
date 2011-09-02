<?php

	require_once(TOOLKIT . '/class.devkit.php');

	class Content_DebugDevKit_XML extends DevKit {
		protected $_view = '';

		public function __construct(){
			parent::__construct();

			$this->_title = __('XML View');
			$this->_query_string = parent::__buildQueryString(array('symphony-page', 'debug'));

			if (!empty($this->_query_string)) {
				$this->_query_string = '&amp;' . General::sanitize($this->_query_string);
			}
		}

		public function build() {
			$this->_view = (strlen(trim($_GET['xml'])) == 0 ? 'data' : $_GET['xml']);

			return parent::build();
		}
		
		public function buildContent($wrapper) {
			header('Content-Type: application/xml');
			if ($this->_view == 'data' || $this->_view == 'xml') {
				echo $this->_xml;
			} else if ($this->_view == 'result') {
				echo $this->_output;
			} else if (file_exists(DOCROOT . $_GET['xml'])) {
				echo @file_get_contents(DOCROOT . $_GET['xml']);
			}
			die();
		}

	}

?>
