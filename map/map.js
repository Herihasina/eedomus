(function($){
	$('polygon').each(function(){
		
		var tmp = $(this).attr('fill');
		var codePays = $(this).data('num');

		// Check the blue zone only
		if (tmp != '#CCCCCB'){

			// Change fill color
			$(this).on('mouseenter',function(){			
				$(this).attr('fill','#ff0000');
			});
			$(this).on('mouseleave',function(){
				$(this).attr('fill',tmp);
			});

			// Show the partner depending on the country		
			$(this).on('click',function(){
				$('.detail-list').html('');
				$('.detail-list').html('<li>'+ getCountry(codePays) +'</li>');
			});
		}		
	});

	function getCountry(code){
		var country = '';
		switch (code){
			case 'FI':
				country = 'Finlande';
				break;
			case 'GB':
				country = 'Royaume Uni';
				break;
			case 'BE':
				country = 'Belgique';
				break;
			case 'LU':
				country = 'Luxembourg';
				break;
			case 'FR':
				country = 'France';
				break;
			case 'SW':
				country = 'Suisse';
				break;
			case 'IT':
				country = 'Italie';
				break;
			case 'PT':
				country = 'Portugal';
				break;
			case 'SI':
				country = 'Sicile';
				break;
			case 'SA':
				country = 'Sardaigne';
				break;
			case 'ES':
				country = 'Espagne';
				break;
			case 'CO':
				country = 'Corse';
				break;
		}
		return country;
	}

}) (jQuery);