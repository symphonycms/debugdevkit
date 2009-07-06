<?php
/*----------------------------------------------------------------------------*/
	
	class BitterFormatSymphony extends BitterFormat {
		protected $tabsize = 4;
		protected $line = 1;
		protected $output = '';
		
		public function process($source) {
			$this->output = $source;
			
			$this->processTabs();
			$this->processLines();
			
			return sprintf(
				'<table class="source">%s</table>',
				$this->output
			);
		}
		
		protected function processTabs() {
			if (!function_exists('__expander')) eval("
				function __expander(\$matches) {
					return \$matches[1] . str_repeat(
						' ', strlen(\$matches[2]) * {$this->tabsize} - (strlen(\$matches[1]) % {$this->tabsize})
					);
				}
			");
			
			while (strstr($this->output, "\t")) {
				$this->output = preg_replace_callback('%^([^\t\n]*)(\t+)%m', '__expander', $this->output);
			}
		}
		
		protected function processLines() {
			$tokens = preg_split('%(<span class=".*?">|</span>)%', $this->output, 0, PREG_SPLIT_DELIM_CAPTURE);
			$stack = array(); $this->output = '';
			
			$this->startLine();
			
			foreach ($tokens as $token) {
				// Close:
				if (preg_match('%^</%', $token)) {
					array_pop($stack);
					$this->output .= $token;
				}
				
				// Open:
				else if (preg_match('%^<%', $token)) {
					array_push($stack, $token);
					$this->output .= $token;
				}
				
				else {
					$characters = preg_split('//', $token);
					
					foreach ($characters as $character) {
						if ($character == "\n") {
							$this->endLine();
							
							foreach ($stack as $alt_token) $this->output .= '</span>';
						}
						
						$this->output .= $character;
						
						if ($character == "\n") {
							$this->startLine();
							
							foreach ($stack as $alt_token) $this->output .= $alt_token;
						}
					}
				}
			}
			
			$this->endLine();
		}
		
		protected function startLine() {
			$this->output .= "<tr id=\"line-{$this->line}\">";
			$this->output .= "<th><a href=\"#line-{$this->line}\">{$this->line}</a></th>";
			$this->output .= "<td>";
		}
		
		protected function endLine() {
			$this->line++;
			$this->output .= '</td>';
			$this->output .= '</tr>';
		}
	}
	
/*----------------------------------------------------------------------------*/
	
	return new BitterFormatSymphony();
	
/*----------------------------------------------------------------------------*/
?>