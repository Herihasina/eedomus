(function($){
	$('polygon').each(function(){
		$(this).on('click',function(){
			console.log( $(this).data('num') )
		});
	});
}) (jQuery);