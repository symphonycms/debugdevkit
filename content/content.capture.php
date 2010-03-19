<?php
	
	require_once(TOOLKIT . '/class.devkit.php');
	
	class Content_DebugDevkit_Capture extends DevKit {
		public function prepare($page, $pagedata, $xml, $param, $output) {
			parent::prepare($page, $pagedata, $xml, $param, $output);
			
			$unique_id = sprintf(
				'symphony-debug-capture-for-author-%d',
				Frontend::instance()->Author->get('id')
			);
			
			$_SESSION[$unique_id] = array(
				'param'		=> $param,
				'xml'		=> $xml,
				'output'	=> $output
			);
		}
		
		public function build() {
			$page = $this->_page;
			$data = $this->_pagedata;
			$type = $data['type'];
			
			if (@in_array('XML', $type) or @in_array('xml', $type)) {
				$this->addHeaderToPage('Content-Type', 'text/xml; charset=utf-8');
			}
			
			else {
				$this->addHeaderToPage('Content-Type', 'text/html; charset=utf-8');
			}
			
			if (@in_array('404', $type)) {
				$this->addHeaderToPage('HTTP/1.0 404 Not Found');
			}
			
			else if (@in_array('403', $type)) {
				$this->addHeaderToPage('HTTP/1.0 403 Forbidden');
			}
			
			$this->__renderHeaders();
			
			echo $this->_output; exit;
		}
	}
	
?>